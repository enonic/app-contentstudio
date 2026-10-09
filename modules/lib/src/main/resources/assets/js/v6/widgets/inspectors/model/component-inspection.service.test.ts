import { atom, computed, type WritableAtom } from 'nanostores';
import { err, ok, type Result } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Descriptor } from '../../../../app/page/Descriptor';
import { DescriptorKey } from '../../../../app/page/DescriptorKey';
import { PartComponentBuilder } from '../../../../app/page/region/PartComponent';
import type { SiteModel } from '../../../../app/site/SiteModel';
import type { PageEditorContentContext } from './page-editor/types';
import { deferred, inspectionContext as context } from './inspectionTestUtils';

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
            ctx ? `${ctx.contentId.toString()}:${ctx.sitePath}` : null,
        ),
        $inspectedItem: atom(null),
        $pageVersion: atom(0),
    };
});

import { $contentContext, $inspectedItem } from './page-editor/store';
import {
    $areLayoutDescriptorsResolved,
    $arePartDescriptorsResolved,
    $componentConfigDescriptor,
    $isComponentInspectionLoading,
    $layoutDescriptorOptions,
    $partDescriptorOptions,
    $partIconUrls,
    $partDescriptorRefreshVersion,
    isReferenceMissing,
} from './component-inspection.store';
import { startComponentInspectionService, stopComponentInspectionService } from './component-inspection.service';

const $context = $contentContext as WritableAtom<PageEditorContentContext | null>;
const $item = $inspectedItem as unknown as WritableAtom<unknown>;
type DescriptorResult = Result<Descriptor[], Error>;
const responses: Record<'part' | 'layout', Promise<DescriptorResult>[]> = { part: [], layout: [] };

function descriptor(key: string, iconUrl = '/' + key + '.svg'): Descriptor {
    return { getKey: () => ({ toString: () => key }), getIcon: () => iconUrl } as Descriptor;
}

function enqueue(type: 'part' | 'layout', result: DescriptorResult | Promise<DescriptorResult>): void {
    responses[type].push(Promise.resolve(result));
}

function callsFor(type: string): number {
    return loadComponentDescriptors.mock.calls.filter(([requestedType]) => requestedType === type).length;
}

function siteModel(): {
    model: SiteModel;
    notifyUpdated: () => void;
    notifyApplicationStarted: () => void;
    setApplicationKeys: (keys: string[]) => void;
} {
    const updateListeners = new Set<() => void>();
    const applicationListeners = new Set<() => void>();
    let applicationKeys = ['app'];
    return {
        model: {
            getApplicationKeys: () => applicationKeys,
            onApplicationAdded: vi.fn(),
            unApplicationAdded: vi.fn(),
            onApplicationRemoved: vi.fn(),
            unApplicationRemoved: vi.fn(),
            onApplicationStarted: (listener: () => void) => applicationListeners.add(listener),
            unApplicationStarted: (listener: () => void) => applicationListeners.delete(listener),
            onApplicationUnavailable: vi.fn(),
            unApplicationUnavailable: vi.fn(),
            onApplicationUninstalled: vi.fn(),
            unApplicationUninstalled: vi.fn(),
            onSiteModelUpdated: (listener: () => void) => updateListeners.add(listener),
            unSiteModelUpdated: (listener: () => void) => updateListeners.delete(listener),
        } as unknown as SiteModel,
        notifyUpdated: () => updateListeners.forEach((listener) => listener()),
        notifyApplicationStarted: () => applicationListeners.forEach((listener) => listener()),
        setApplicationKeys: (keys) => {
            applicationKeys = keys;
        },
    };
}

async function waitForLoad(): Promise<void> {
    await vi.waitFor(() => expect($isComponentInspectionLoading.get()).toBe(false));
}

describe('component inspection service', () => {
    beforeEach(() => {
        responses.part = [];
        responses.layout = [];
        loadComponentDescriptors.mockReset();
        loadComponentDescriptors.mockImplementation((type: 'part' | 'layout') => {
            const response = responses[type].shift();
            if (!response) throw new Error('Unexpected ' + type + ' request');
            return response;
        });
        loadComponentDescriptor.mockReset();
        loadComponentDescriptor.mockReturnValue({ unwrapOr: async () => undefined });
    });

    afterEach(() => {
        vi.useRealTimers();
        stopComponentInspectionService();
        $context.set(null);
        $item.set(null);
    });

    it('keeps options and avoids requests when a save republishes the same scope', async () => {
        const part = descriptor('app:hero');
        const site = siteModel();
        enqueue('part', ok([part]));
        enqueue('layout', ok([]));
        $context.set(context('content-id'));
        startComponentInspectionService(site.model);
        await waitForLoad();

        const version = $partDescriptorRefreshVersion.get();
        $context.set(context('content-id'));
        startComponentInspectionService(site.model);
        $context.set(context('content-id'));
        startComponentInspectionService(site.model);

        expect(callsFor('part')).toBe(1);
        expect(callsFor('layout')).toBe(1);
        expect($partDescriptorOptions.get()).toEqual([part]);
        expect($partDescriptorRefreshVersion.get()).toBe(version);
    });

    it('keeps an in-flight descriptor response across a site rename', async () => {
        const part = descriptor('app:hero');
        const pendingPart = deferred<DescriptorResult>();
        enqueue('part', pendingPart.promise);
        enqueue('layout', ok([]));
        $context.set(context('content-id', '/site'));
        startComponentInspectionService();
        await vi.waitFor(() => expect(callsFor('part')).toBe(1));

        $context.set(context('content-id', '/renamed-site'));
        expect(callsFor('part')).toBe(1);
        pendingPart.resolve(ok([part]));
        await waitForLoad();
        expect($partDescriptorOptions.get()).toEqual([part]);
        expect($partIconUrls.get().get('app:hero')).toBe('/app:hero.svg');
    });

    it('does not reload descriptors when a site rename updates only site metadata', async () => {
        const part = descriptor('app:hero');
        const site = siteModel();
        enqueue('part', ok([part]));
        enqueue('layout', ok([]));
        $context.set(context('content-id', '/site'));
        startComponentInspectionService(site.model);
        await waitForLoad();

        vi.useFakeTimers();
        site.notifyUpdated();
        $context.set(context('content-id', '/renamed-site'));
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();

        expect(callsFor('part')).toBe(1);
        expect($partDescriptorOptions.get()).toEqual([part]);
    });

    it('reloads descriptors when a site update changes its applications', async () => {
        const site = siteModel();
        enqueue('part', ok([descriptor('app:hero')]));
        enqueue('layout', ok([]));
        $context.set(context('content-id'));
        startComponentInspectionService(site.model);
        await waitForLoad();

        enqueue('part', ok([descriptor('other:hero')]));
        enqueue('layout', ok([]));
        vi.useFakeTimers();
        site.setApplicationKeys(['app', 'other']);
        site.notifyUpdated();
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();
        await waitForLoad();

        expect(callsFor('part')).toBe(2);
        expect($partDescriptorOptions.get()[0].getKey().toString()).toBe('other:hero');
    });

    it('keeps old options on a same-scope SiteModel replacement and accepts new icons after load', async () => {
        const part = descriptor('app:hero');
        enqueue('part', ok([part]));
        enqueue('layout', ok([]));
        $context.set(context('content-id'));
        startComponentInspectionService(siteModel().model);
        await waitForLoad();

        const pendingPart = deferred<DescriptorResult>();
        const pendingLayout = deferred<DescriptorResult>();
        enqueue('part', pendingPart.promise);
        enqueue('layout', pendingLayout.promise);
        startComponentInspectionService(siteModel().model);
        await vi.waitFor(() => expect(callsFor('part')).toBe(2));
        expect($partDescriptorOptions.get()).toEqual([part]);
        expect($arePartDescriptorsResolved.get()).toBe(true);

        pendingPart.resolve(ok([descriptor('app:hero', '/updated.svg')]));
        pendingLayout.resolve(ok([]));
        await waitForLoad();
        expect($partDescriptorOptions.get()[0].getIcon()).toBe('/updated.svg');
    });

    it('retains data on a failed forced refresh, then retries only that type and accepts removal', async () => {
        const part = descriptor('app:hero');
        const site = siteModel();
        enqueue('part', ok([part]));
        enqueue('layout', ok([]));
        $context.set(context('content-id'));
        startComponentInspectionService(site.model);
        await waitForLoad();

        enqueue('part', err(new Error('parts unavailable')));
        enqueue('layout', ok([]));
        vi.useFakeTimers();
        site.notifyApplicationStarted();
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();
        await waitForLoad();
        expect($partDescriptorOptions.get()).toEqual([part]);

        enqueue('part', ok([]));
        startComponentInspectionService(site.model);
        await waitForLoad();
        expect($partDescriptorOptions.get()).toEqual([]);
        expect($partIconUrls.get().get('app:hero')).toBe('/app:hero.svg');
        expect($arePartDescriptorsResolved.get()).toBe(true);
        expect(callsFor('part')).toBe(3);
        expect(callsFor('layout')).toBe(2);
    });

    it('refreshes both descriptor types when the SiteModel changes after a partial failure', async () => {
        const part = descriptor('app:hero');
        const layout = descriptor('app:columns');
        enqueue('part', ok([part]));
        enqueue('layout', err(new Error('layouts unavailable')));
        $context.set(context('content-id'));
        startComponentInspectionService(siteModel().model);
        await waitForLoad();
        expect($areLayoutDescriptorsResolved.get()).toBe(false);

        enqueue('part', ok([descriptor('app:hero', '/new-icon.svg')]));
        enqueue('layout', ok([layout]));
        startComponentInspectionService(siteModel().model);
        await vi.waitFor(() => expect($layoutDescriptorOptions.get()).toEqual([layout]));
        expect($partDescriptorOptions.get()[0].getIcon()).toBe('/new-icon.svg');
        expect(callsFor('part')).toBe(2);
        expect(callsFor('layout')).toBe(2);
    });

    it('clears on a true scope change and ignores a late previous response', async () => {
        const pendingPart = deferred<DescriptorResult>();
        enqueue('part', pendingPart.promise);
        enqueue('layout', ok([]));
        $context.set(context('first-content'));
        startComponentInspectionService();
        await vi.waitFor(() => expect(callsFor('part')).toBe(1));

        enqueue('part', ok([descriptor('app:new')]));
        enqueue('layout', ok([]));
        $context.set(context('second-content'));
        await waitForLoad();
        expect($partDescriptorOptions.get()[0].getKey().toString()).toBe('app:new');

        pendingPart.resolve(ok([descriptor('app:old')]));
        await Promise.resolve();
        expect($partDescriptorOptions.get()[0].getKey().toString()).toBe('app:new');
    });

    it('ignores a late selected descriptor response after scope changes', async () => {
        const first = deferred<Descriptor | undefined>();
        const second = descriptor('app:hero', '/second.svg');
        loadComponentDescriptor
            .mockReturnValueOnce({ unwrapOr: () => first.promise })
            .mockReturnValueOnce({ unwrapOr: async () => second });
        enqueue('part', ok([]));
        enqueue('layout', ok([]));
        $context.set(context('first-content'));
        startComponentInspectionService();
        $item.set(new PartComponentBuilder().setDescriptor(DescriptorKey.fromString('app:hero')).build());
        await vi.waitFor(() => expect(loadComponentDescriptor).toHaveBeenCalledTimes(1));

        enqueue('part', ok([]));
        enqueue('layout', ok([]));
        $context.set(context('second-content'));
        await vi.waitFor(() => expect($componentConfigDescriptor.get()).toBe(second));
        first.resolve(descriptor('app:hero', '/first.svg'));
        await Promise.resolve();
        expect($componentConfigDescriptor.get()).toBe(second);
    });

    it('marks a missing part only after its options have resolved', () => {
        const part = new PartComponentBuilder().setDescriptor(DescriptorKey.fromString('app:hero')).build();
        const unresolved = { fragment: false, part: false, layout: false };
        const resolved = { ...unresolved, part: true };

        expect(isReferenceMissing(part, [], [], unresolved)).toBe(false);
        expect(isReferenceMissing(part, [], [], resolved)).toBe(true);
        expect(isReferenceMissing(part, [], [descriptor('app:hero')], resolved)).toBe(false);
    });
});
