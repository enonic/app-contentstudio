import { atom, computed, type WritableAtom } from 'nanostores';
import { err, ok, type Result } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Content } from '../../../../app/content/Content';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { Component } from '../../../../app/page/region/Component';
import type { ComponentAddedEvent } from '../../../../app/page/region/ComponentAddedEvent';
import { ComponentFragmentCreatedEvent } from '../../../../app/page/region/ComponentFragmentCreatedEvent';
import type { PageEditorContentContext } from './page-editor/types';
import { deferred, inspectionContext as context } from './inspectionTestUtils';

const { fetchFragmentSummaries } = vi.hoisted(() => ({ fetchFragmentSummaries: vi.fn() }));
const { listeners } = vi.hoisted(() => ({ listeners: new Set<(event: ComponentAddedEvent) => void>() }));
vi.mock('../api/fragments.api', () => ({ fetchFragmentSummaries }));
vi.mock('../../../../app/wizard/page/PageState', () => ({
    PageState: {
        getEvents: () => ({
            onComponentAdded: (listener: (event: ComponentAddedEvent) => void) => listeners.add(listener),
            unComponentAdded: (listener: (event: ComponentAddedEvent) => void) => listeners.delete(listener),
        }),
    },
}));
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
vi.mock('../../../shared/socket/socket.store', () => ({
    $contentCreated: atom(null),
    $contentUpdated: atom(null),
    $contentDeleted: atom(null),
    $contentMoved: atom(null),
    $contentRenamed: atom(null),
}));

import { $contentContext } from './page-editor/store';
import { $contentDeleted, $contentUpdated } from '../../../shared/socket/socket.store';
import {
    $areFragmentOptionsResolved,
    $fragmentOptions,
    $isFragmentInspectionLoading,
} from './fragment-inspection.store';
import {
    start as startFragmentInspectionService,
    stop as stopFragmentInspectionService,
} from './fragment-inspection.service';

const $context = $contentContext as WritableAtom<PageEditorContentContext | null>;
const $updated = $contentUpdated as WritableAtom<unknown>;
const $deleted = $contentDeleted as WritableAtom<unknown>;
type FragmentResult = Result<ContentSummary[], Error>;

function fragment(id: string): ContentSummary {
    return { getId: () => id, getType: () => ({ isFragment: () => true }) } as ContentSummary;
}

function createLocally(item: ContentSummary): void {
    const event = new ComponentFragmentCreatedEvent({ getPath: () => null } as unknown as Component, item as Content);
    for (const listener of listeners) {
        listener(event);
    }
}

describe('fragment inspection scope', () => {
    afterEach(() => {
        vi.useRealTimers();
        stopFragmentInspectionService();
        $context.set(null);
        $updated.set(null);
        $deleted.set(null);
        fetchFragmentSummaries.mockReset();
    });

    it('keeps a newly created fragment available through a save and a stale refresh', async () => {
        fetchFragmentSummaries.mockResolvedValueOnce(ok([]));
        $context.set(context());
        startFragmentInspectionService();
        await vi.waitFor(() => expect($areFragmentOptionsResolved.get()).toBe(true));

        const created = fragment('new-fragment');
        const pending = deferred<FragmentResult>();
        fetchFragmentSummaries.mockReturnValueOnce(pending.promise);
        createLocally(created);
        expect($fragmentOptions.get()).toContain(created);

        $context.set(context());
        startFragmentInspectionService();
        expect(fetchFragmentSummaries).toHaveBeenCalledTimes(2);
        pending.resolve(ok([]));
        await vi.waitFor(() => expect($isFragmentInspectionLoading.get()).toBe(false));
        expect($fragmentOptions.get()).toContain(created);

        fetchFragmentSummaries.mockResolvedValueOnce(ok([]));
        vi.useFakeTimers();
        $deleted.set({ timestamp: 1, data: [{ getContentId: () => ({ toString: () => created.getId() }) }] });
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();
        await vi.waitFor(() => expect($fragmentOptions.get()).toEqual([]));
    });

    it('retains confirmed options on refresh failure and clears only on a true scope change', async () => {
        const selected = fragment('selected');
        fetchFragmentSummaries.mockResolvedValueOnce(ok([selected]));
        $context.set(context());
        startFragmentInspectionService();
        await vi.waitFor(() => expect($fragmentOptions.get()).toEqual([selected]));

        fetchFragmentSummaries.mockResolvedValueOnce(err(new Error('offline')));
        vi.useFakeTimers();
        $updated.set({ timestamp: 1, data: [selected] });
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();
        expect($fragmentOptions.get()).toEqual([selected]);

        const pending = deferred<FragmentResult>();
        fetchFragmentSummaries.mockReturnValueOnce(pending.promise);
        $context.set(context('other-content'));
        expect($fragmentOptions.get()).toEqual([]);
        pending.resolve(ok([selected]));
        await vi.waitFor(() => expect($isFragmentInspectionLoading.get()).toBe(false));
        expect($fragmentOptions.get()).toEqual([selected]);
    });

    it('keeps selected and locally created fragments during a site rename', async () => {
        const selected = fragment('selected');
        fetchFragmentSummaries.mockResolvedValueOnce(ok([selected]));
        $context.set(context());
        startFragmentInspectionService();
        await vi.waitFor(() => expect($fragmentOptions.get()).toEqual([selected]));

        const created = fragment('created');
        const pendingAfterCreation = deferred<FragmentResult>();
        fetchFragmentSummaries.mockReturnValueOnce(pendingAfterCreation.promise);
        createLocally(created);

        const pendingAfterRename = deferred<FragmentResult>();
        fetchFragmentSummaries.mockReturnValueOnce(pendingAfterRename.promise);
        $context.set(context('content-id', '/renamed-site'));
        expect($fragmentOptions.get()).toEqual([selected, created]);
        expect($areFragmentOptionsResolved.get()).toBe(false);

        pendingAfterCreation.resolve(ok([]));
        await vi.waitFor(() => expect(fetchFragmentSummaries).toHaveBeenCalledTimes(3));
        pendingAfterRename.resolve(ok([]));
        await vi.waitFor(() => expect($isFragmentInspectionLoading.get()).toBe(false));
        expect($fragmentOptions.get()).toEqual([created]);
    });
});
