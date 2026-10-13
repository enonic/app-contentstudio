import { atom, computed, type WritableAtom } from 'nanostores';
import { err, ok, type Result } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Descriptor } from '../../../../app/page/Descriptor';
import type { PageEditorContentContext } from './page-editor/types';
import { deferred, inspectionContext as context, siteModel } from './inspectionTestUtils';

const { loadComponentDescriptors, loadComponentDescriptor } = vi.hoisted(() => ({
    loadComponentDescriptors: vi.fn(),
    loadComponentDescriptor: vi.fn(),
}));
vi.mock('../api/componentInspection.api', () => ({ loadComponentDescriptors, loadComponentDescriptor }));
vi.mock('./page-editor/store', () => {
    const $contentContext = atom<PageEditorContentContext | null>(null);
    return {
        $contentContext,
        $contentScopeKey: computed($contentContext, (ctx) =>
            ctx ? `${ctx.contentId.toString()}:${ctx.siteId?.toString()}:${ctx.sitePath}` : null,
        ),
        $inspectedItem: atom(null),
        $pageVersion: atom(0),
    };
});

import { $contentContext } from './page-editor/store';
import {
    $areLayoutDescriptorsResolved,
    $arePartDescriptorsResolved,
    $isComponentInspectionLoading,
    $layoutDescriptorOptions,
    $partDescriptorOptions,
    cleanupComponentInspection,
    initComponentInspectionService,
} from './component-inspection.store';

const $context = $contentContext as WritableAtom<PageEditorContentContext | null>;

function descriptor(key: string): Descriptor {
    return { getKey: () => ({ toString: () => key }), getIcon: () => '/custom.svg' } as Descriptor;
}

describe('component inspection scope', () => {
    afterEach(() => {
        vi.useRealTimers();
        cleanupComponentInspection();
        $context.set(null);
        loadComponentDescriptors.mockReset();
        loadComponentDescriptor.mockReset();
    });

    it('preserves a custom part through a save and a replacement SiteModel refresh', async () => {
        const part = descriptor('app:hero');
        loadComponentDescriptors.mockImplementation((type: string) =>
            Promise.resolve(ok(type === 'part' ? [part] : [])),
        );
        const firstModel = siteModel();
        $context.set(context());
        initComponentInspectionService(firstModel.value);
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
        expect($partDescriptorOptions.get()).toEqual([part]);

        $context.set(context());
        initComponentInspectionService(firstModel.value);
        expect(loadComponentDescriptors).toHaveBeenCalledTimes(2);

        const pendingPart = deferred<Result<Descriptor[], Error>>();
        const pendingLayout = deferred<Result<Descriptor[], Error>>();
        loadComponentDescriptors.mockImplementation((type: string) =>
            type === 'part' ? pendingPart.promise : pendingLayout.promise,
        );
        const replacement = siteModel();
        initComponentInspectionService(replacement.value);
        expect(firstModel.listeners.size).toBe(0);
        expect($partDescriptorOptions.get()).toEqual([part]);
        pendingPart.resolve(err(new Error('part unavailable')));
        pendingLayout.resolve(ok([]));
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
        expect($partDescriptorOptions.get()).toEqual([part]);

        loadComponentDescriptors.mockResolvedValue(ok([part]));
        initComponentInspectionService(replacement.value);
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
        expect(loadComponentDescriptors.mock.calls.map(([type]) => type).slice(-1)).toEqual(['part']);
    });

    it('keeps descriptor options during a site rename until the new scope resolves', async () => {
        const part = descriptor('app:hero');
        loadComponentDescriptors.mockImplementation((type: string) =>
            Promise.resolve(ok(type === 'part' ? [part] : [])),
        );
        $context.set(context());
        initComponentInspectionService();
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));

        const pendingPart = deferred<Result<Descriptor[], Error>>();
        loadComponentDescriptors.mockImplementation((type: string) =>
            type === 'part' ? pendingPart.promise : Promise.resolve(ok([])),
        );
        $context.set(context('content-id', '/renamed-site'));

        expect($partDescriptorOptions.get()).toEqual([part]);
        expect($arePartDescriptorsResolved.get()).toBe(false);
        await vi.waitFor(() => expect(loadComponentDescriptors).toHaveBeenCalledTimes(4));

        pendingPart.resolve(ok([]));
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
        expect($partDescriptorOptions.get()).toEqual([]);
        expect($arePartDescriptorsResolved.get()).toBe(true);
    });

    it('retries only a failed descriptor type and ignores an old scope response', async () => {
        const part = descriptor('app:hero');
        loadComponentDescriptors.mockImplementation((type: string) =>
            Promise.resolve(type === 'part' ? err(new Error('offline')) : ok([])),
        );
        $context.set(context());
        initComponentInspectionService();
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
        expect($arePartDescriptorsResolved.get()).toBe(false);
        expect($areLayoutDescriptorsResolved.get()).toBe(true);

        const oldPart = deferred<Result<Descriptor[], Error>>();
        loadComponentDescriptors.mockImplementation((type: string) =>
            type === 'part' ? oldPart.promise : Promise.resolve(ok([])),
        );
        initComponentInspectionService();
        await vi.waitFor(() => expect(loadComponentDescriptors).toHaveBeenCalledTimes(3));
        expect(loadComponentDescriptors.mock.calls.map(([type]) => type)).toEqual(['part', 'layout', 'part']);

        loadComponentDescriptors.mockResolvedValue(ok([part]));
        $context.set(context('other-content'));
        oldPart.resolve(ok([descriptor('old:part')]));
        await vi.waitFor(() => expect($partDescriptorOptions.get()).toEqual([part]));
        expect($layoutDescriptorOptions.get()).toEqual([part]);
    });

    it('refreshes on a SiteModel application event without clearing current options', async () => {
        const part = descriptor('app:hero');
        loadComponentDescriptors.mockImplementation((type: string) =>
            Promise.resolve(ok(type === 'part' ? [part] : [])),
        );
        const model = siteModel();
        $context.set(context());
        initComponentInspectionService(model.value);
        await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));

        vi.useFakeTimers();
        model.fire();
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();
        expect($partDescriptorOptions.get()).toEqual([part]);
        expect(loadComponentDescriptors).toHaveBeenCalledTimes(4);
    });
});
