import { atom, type WritableAtom } from 'nanostores';
import { err, ok, type Result } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Descriptor } from '../../../../app/page/Descriptor';
import { DescriptorKey } from '../../../../app/page/DescriptorKey';
import { PartComponentBuilder } from '../../../../app/page/region/PartComponent';
import type { SiteModel } from '../../../../app/site/SiteModel';
import type { PageEditorContentContext } from './page-editor/types';

const { loadComponentDescriptors, loadComponentDescriptor } = vi.hoisted(() => ({
    loadComponentDescriptors: vi.fn(),
    loadComponentDescriptor: vi.fn(),
}));

vi.mock('../api/componentInspection.api', () => ({ loadComponentDescriptors, loadComponentDescriptor }));
vi.mock('./page-editor/store', () => ({
    $contentContext: atom<PageEditorContentContext | null>(null),
    $inspectedItem: atom(null),
    $pageVersion: atom(0),
}));

import { $contentContext, $inspectedItem } from './page-editor/store';
import {
    $componentConfigDescriptor,
    $isComponentInspectionLoading,
    $layoutDescriptorOptions,
    $partDescriptorIconUrls,
    $partDescriptorOptions,
    cleanupComponentInspection,
    initComponentInspectionService,
} from './component-inspection.store';

const $context = $contentContext as WritableAtom<PageEditorContentContext | null>;
const $item = $inspectedItem as unknown as WritableAtom<unknown>;

function context(contentId: string, sitePath = '/site'): PageEditorContentContext {
    return {
        contentId: { toString: () => contentId },
        contentTypeName: { toString: () => 'app:article' },
        siteId: { toString: () => 'site-id' },
        sitePath,
    } as PageEditorContentContext;
}

function descriptor(key: string, iconUrl: string | null = `/${key}.svg`): Descriptor {
    return { getKey: () => ({ toString: () => key }), getIcon: () => iconUrl ?? undefined } as Descriptor;
}

function deferred() {
    let resolve!: (result: Result<Descriptor[], Error>) => void;
    const promise = new Promise<Result<Descriptor[], Error>>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

function siteModel(): { model: SiteModel; notifyUpdated: () => void; notifyStarted: () => void } {
    const updatedListeners = new Set<() => void>();
    const startedListeners = new Set<() => void>();
    return {
        model: {
            onApplicationAdded: vi.fn(),
            unApplicationAdded: vi.fn(),
            onApplicationRemoved: vi.fn(),
            unApplicationRemoved: vi.fn(),
            onApplicationStarted: (listener: () => void) => startedListeners.add(listener),
            unApplicationStarted: (listener: () => void) => startedListeners.delete(listener),
            onApplicationUnavailable: vi.fn(),
            unApplicationUnavailable: vi.fn(),
            onApplicationUninstalled: vi.fn(),
            unApplicationUninstalled: vi.fn(),
            onSiteModelUpdated: (listener: () => void) => updatedListeners.add(listener),
            unSiteModelUpdated: (listener: () => void) => updatedListeners.delete(listener),
        } as unknown as SiteModel,
        notifyUpdated: () => updatedListeners.forEach((listener) => listener()),
        notifyStarted: () => startedListeners.forEach((listener) => listener()),
    };
}

describe('component inspection descriptors', () => {
    afterEach(() => {
        vi.useRealTimers();
        cleanupComponentInspection();
        $context.set(null);
        $item.set(null);
        loadComponentDescriptors.mockReset();
        loadComponentDescriptor.mockReset();
    });

    it('keeps part icons and skips descriptor requests when a save republishes the same scope', async () => {
        const part = descriptor('app:hero');
        const layout = descriptor('app:columns');
        const site = siteModel();
        loadComponentDescriptors.mockResolvedValueOnce(ok([part])).mockResolvedValueOnce(ok([layout]));

        $context.set(context('content-id'));
        initComponentInspectionService(site.model);
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
        expect($partDescriptorOptions.get()).toEqual([part]);
        expect($partDescriptorIconUrls.get().get('app:hero')).toBe('/app:hero.svg');

        // ContentWizardPanel calls setModel twice around a normal save.
        $context.set(context('content-id'));
        initComponentInspectionService(site.model);
        $context.set(context('content-id'));
        initComponentInspectionService(site.model);

        expect(loadComponentDescriptors).toHaveBeenCalledTimes(2);
        expect($partDescriptorOptions.get()).toEqual([part]);
        expect($layoutDescriptorOptions.get()).toEqual([layout]);
    });

    it('keeps the last part icon on failure and accepts a real removal after a site update', async () => {
        const part = descriptor('app:hero');
        const site = siteModel();
        loadComponentDescriptors.mockResolvedValueOnce(ok([part])).mockResolvedValueOnce(ok([]));

        $context.set(context('content-id'));
        initComponentInspectionService(site.model);
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));

        loadComponentDescriptors
            .mockResolvedValueOnce(err(new Error('parts unavailable')))
            .mockResolvedValueOnce(ok([]));
        vi.useFakeTimers();
        site.notifyUpdated();
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
        expect($partDescriptorOptions.get()).toEqual([part]);

        loadComponentDescriptors.mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok([]));
        vi.useFakeTimers();
        site.notifyUpdated();
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();
        await vi.waitFor(() => expect($partDescriptorOptions.get()).toEqual([]));
        expect($partDescriptorIconUrls.get().get('app:hero')).toBe('/app:hero.svg');
    });

    it('refreshes on application start and replaces the icon when a new URL arrives', async () => {
        const part = descriptor('app:hero');
        const site = siteModel();
        loadComponentDescriptors.mockResolvedValueOnce(ok([part])).mockResolvedValueOnce(ok([]));

        $context.set(context('content-id'));
        initComponentInspectionService(site.model);
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));

        loadComponentDescriptors
            .mockResolvedValueOnce(ok([descriptor('app:hero', '/updated.svg')]))
            .mockResolvedValueOnce(ok([]));
        vi.useFakeTimers();
        site.notifyStarted();
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();

        await vi.waitFor(() => expect($partDescriptorIconUrls.get().get('app:hero')).toBe('/updated.svg'));
        expect(loadComponentDescriptors).toHaveBeenCalledTimes(4);
    });

    it('keeps custom icons while a replacement SiteModel reloads the same content', async () => {
        const part = descriptor('app:hero');
        loadComponentDescriptors.mockResolvedValueOnce(ok([part])).mockResolvedValueOnce(ok([]));

        $context.set(context('content-id'));
        initComponentInspectionService(siteModel().model);
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));

        const nextPart = deferred();
        const nextLayout = deferred();
        loadComponentDescriptors.mockReturnValueOnce(nextPart.promise).mockReturnValueOnce(nextLayout.promise);
        initComponentInspectionService(siteModel().model);
        await vi.waitFor(() => expect(loadComponentDescriptors).toHaveBeenCalledTimes(4));

        expect($partDescriptorOptions.get()).toEqual([part]);
        expect($partDescriptorIconUrls.get().get('app:hero')).toBe('/app:hero.svg');

        nextPart.resolve(ok([part]));
        nextLayout.resolve(ok([]));
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
    });

    it('keeps an existing custom icon when a successful refresh omits its descriptor', async () => {
        const part = descriptor('app:hero');
        const site = siteModel();
        loadComponentDescriptors.mockResolvedValueOnce(ok([part])).mockResolvedValueOnce(ok([]));

        $context.set(context('content-id'));
        initComponentInspectionService(site.model);
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));

        loadComponentDescriptors.mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok([]));
        vi.useFakeTimers();
        site.notifyUpdated();
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();

        await vi.waitFor(() => expect($partDescriptorOptions.get()).toEqual([]));
        expect($partDescriptorIconUrls.get().get('app:hero')).toBe('/app:hero.svg');

        loadComponentDescriptors
            .mockResolvedValueOnce(ok([descriptor('app:hero', null)]))
            .mockResolvedValueOnce(ok([]));
        vi.useFakeTimers();
        site.notifyUpdated();
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();

        await vi.waitFor(() => expect($partDescriptorIconUrls.get().has('app:hero')).toBe(false));
    });

    it('retries only the descriptor type that failed', async () => {
        const part = descriptor('app:hero');
        const layout = descriptor('app:columns');
        loadComponentDescriptors
            .mockResolvedValueOnce(ok([part]))
            .mockResolvedValueOnce(err(new Error('layouts unavailable')));

        $context.set(context('content-id'));
        initComponentInspectionService();
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
        expect($partDescriptorOptions.get()).toEqual([part]);

        loadComponentDescriptors.mockResolvedValueOnce(ok([layout]));
        $context.set(context('content-id'));
        await vi.waitFor(() => expect($layoutDescriptorOptions.get()).toEqual([layout]));

        expect(loadComponentDescriptors).toHaveBeenCalledTimes(3);
        expect(loadComponentDescriptors.mock.calls[2][0]).toBe('layout');
        expect($partDescriptorOptions.get()).toEqual([part]);
    });

    it('clears descriptors when the content moves to a different scope', async () => {
        const part = descriptor('app:hero');
        loadComponentDescriptors.mockResolvedValueOnce(ok([part])).mockResolvedValueOnce(ok([]));

        $context.set(context('content-id'));
        initComponentInspectionService();
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));

        loadComponentDescriptors.mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok([]));
        $context.set(context('content-id', '/other-site'));

        expect($partDescriptorOptions.get()).toEqual([]);
        expect($partDescriptorIconUrls.get().get('app:hero')).toBe('/app:hero.svg');
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
        expect(loadComponentDescriptors).toHaveBeenCalledTimes(4);
    });

    it('reloads the selected component descriptor when its scope changes', async () => {
        const first = descriptor('app:hero', '/first.svg');
        const second = descriptor('app:hero', '/second.svg');
        const site = siteModel();
        loadComponentDescriptors.mockResolvedValue(ok([]));
        loadComponentDescriptor
            .mockReturnValueOnce({ unwrapOr: async () => first })
            .mockReturnValueOnce({ unwrapOr: async () => second });

        $context.set(context('content-id'));
        initComponentInspectionService(site.model);
        $item.set(new PartComponentBuilder().setDescriptor(DescriptorKey.fromString('app:hero')).build());
        await vi.waitFor(() => expect(loadComponentDescriptor).toHaveBeenCalledTimes(1));
        await vi.waitFor(() => expect($componentConfigDescriptor.get()).toBe(first));

        $context.set(context('content-id', '/other-site'));
        initComponentInspectionService(site.model);
        await vi.waitFor(() => expect($componentConfigDescriptor.get()).toBe(second));
        expect(loadComponentDescriptor).toHaveBeenCalledTimes(2);
    });

    it('drops remembered icons when opening another content', async () => {
        const part = descriptor('app:hero');
        loadComponentDescriptors.mockResolvedValueOnce(ok([part])).mockResolvedValueOnce(ok([]));

        $context.set(context('first-content'));
        initComponentInspectionService();
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));

        loadComponentDescriptors.mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok([]));
        $context.set(context('second-content'));

        expect($partDescriptorIconUrls.get().has('app:hero')).toBe(false);
    });
});
