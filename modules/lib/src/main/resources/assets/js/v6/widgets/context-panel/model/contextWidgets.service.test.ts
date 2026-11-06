import { ApplicationEvent, ApplicationEventType } from '@enonic/lib-admin-ui/application/ApplicationEvent';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import type { Extension } from '@enonic/lib-admin-ui/extension/Extension';
import type { AppError } from '@enonic/ui-utils';
import { ok, type Result } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { $config } from '../../../shared/config/config.store';
import { $contextWidgets } from './contextWidgets.store';
import { start, stop } from './contextWidgets.service';

vi.mock('@enonic/lib-admin-ui/auth/AuthHelper', () => ({
    AuthHelper: { isContentAdmin: () => false },
}));

vi.mock('../../../shared/notifications', () => ({
    notifyError: vi.fn(),
}));

vi.mock('../../../shared/i18n', () => ({
    i18n: (key: string) => key,
}));

const { fetchExtensions } = vi.hoisted(() => ({
    fetchExtensions: vi.fn<() => Promise<Result<Extension[], AppError>>>(),
}));

vi.mock('../../../entities/extension', () => ({ fetchExtensions }));

type Deferred = {
    resolve: (extensions: Extension[]) => void;
};

const defer = (): Deferred => {
    let resolve: Deferred['resolve'] = () => undefined;
    const promise = new Promise<Result<Extension[], AppError>>((res) => {
        resolve = (extensions) => res(ok(extensions));
    });
    fetchExtensions.mockReturnValueOnce(promise);
    return { resolve };
};

const createExtension = (applicationKey: string, name: string): Extension =>
    ({
        getDescriptorKey: () => ({
            toString: () => `${applicationKey}:${name}`,
            getName: () => name,
            getApplicationKey: () => ({ toString: () => applicationKey }),
        }),
        getUrl: () => `widgets/${name}`,
        getIconUrl: () => undefined,
        getTitle: () => name,
        getDescription: () => '',
        getConfig: () => undefined,
    }) as unknown as Extension;

const fire = (applicationKey: string, type: ApplicationEventType): void => {
    new ApplicationEvent(ApplicationKey.fromString(applicationKey), type, false).fire();
};

const customWidgetKeys = (): string[] =>
    $contextWidgets
        .get()
        .filter((widget) => widget.url != null)
        .map((widget) => widget.key);

const flush = (): Promise<void> => new Promise((resolve) => queueMicrotask(() => queueMicrotask(resolve)));

beforeEach(() => {
    vi.useFakeTimers();
    $config.setKey('appId', 'com.enonic.app.contentstudio');
    $config.setKey('extensionApiUrl', '/admin/rest/extensions');
});

afterEach(() => {
    stop();
    fetchExtensions.mockReset();
    vi.restoreAllMocks();
});

describe('contextWidgets.service', () => {
    it('should register custom widgets from the initial load', async () => {
        const initial = defer();
        start();

        initial.resolve([createExtension('com.app', 'layers')]);
        await flush();

        expect(customWidgetKeys()).toEqual(['com.app:layers']);
    });

    it('should not restore widgets of an application stopped while a reload is in flight', async () => {
        const initial = defer();
        start();
        initial.resolve([createExtension('com.app', 'layers')]);
        await flush();

        const reload = defer();
        fire('com.app', ApplicationEventType.STARTED);
        await vi.advanceTimersByTimeAsync(1000);
        expect(fetchExtensions).toHaveBeenCalledTimes(2);

        fire('com.app', ApplicationEventType.STOPPED);
        expect(customWidgetKeys()).toEqual([]);

        reload.resolve([createExtension('com.app', 'layers')]);
        await flush();

        expect(customWidgetKeys()).toEqual([]);
    });

    it('should schedule a fresh load after invalidating an in-flight one', async () => {
        const initial = defer();
        start();
        initial.resolve([]);
        await flush();

        const reload = defer();
        fire('com.app', ApplicationEventType.STARTED);
        await vi.advanceTimersByTimeAsync(1000);

        fire('com.other', ApplicationEventType.STOPPED);
        reload.resolve([createExtension('com.app', 'layers'), createExtension('com.other', 'stale')]);
        await flush();
        expect(customWidgetKeys()).toEqual([]);

        const fresh = defer();
        await vi.advanceTimersByTimeAsync(1000);
        expect(fetchExtensions).toHaveBeenCalledTimes(3);

        fresh.resolve([createExtension('com.app', 'layers')]);
        await flush();

        expect(customWidgetKeys()).toEqual(['com.app:layers']);
    });

    it('should ignore a load that resolves after stop', async () => {
        const initial = defer();
        start();
        stop();

        initial.resolve([createExtension('com.app', 'layers')]);
        await flush();

        expect($contextWidgets.get()).toEqual([]);
    });
});
