import { atom, computed, type WritableAtom } from 'nanostores';
import { err, ok, type Result } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { PageEditorContentContext } from './page-editor/types';
import { deferred, inspectionContext as context } from './inspectionTestUtils';

const { fetchFragmentSummaries } = vi.hoisted(() => ({ fetchFragmentSummaries: vi.fn() }));
vi.mock('../api/fragments.api', () => ({ fetchFragmentSummaries }));
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
import { $contentUpdated } from '../../../shared/socket/socket.store';
import {
    $areFragmentOptionsResolved,
    $fragmentOptions,
    $isFragmentInspectionLoading,
    cleanupFragmentInspection,
    initFragmentInspectionService,
} from './fragment-inspection.store';

const $context = $contentContext as WritableAtom<PageEditorContentContext | null>;
const $updated = $contentUpdated as WritableAtom<unknown>;
type FragmentResult = Result<ContentSummary[], Error>;

function fragment(id: string): ContentSummary {
    return {
        getId: () => id,
        getType: () => ({ isFragment: () => true }),
    } as ContentSummary;
}

describe('fragment inspection service', () => {
    afterEach(() => {
        vi.useRealTimers();
        cleanupFragmentInspection();
        $context.set(null);
        $updated.set(null);
        fetchFragmentSummaries.mockReset();
    });

    it('keeps the selected option and skips requests on a same-content save', async () => {
        const selected = fragment('fragment-id');
        fetchFragmentSummaries.mockResolvedValue(ok([selected]));
        $context.set(context());
        initFragmentInspectionService();
        await vi.waitFor(() => expect($fragmentOptions.get()).toEqual([selected]));

        $context.set(context());
        initFragmentInspectionService();
        expect($fragmentOptions.get()).toEqual([selected]);
        expect(fetchFragmentSummaries).toHaveBeenCalledTimes(1);
    });

    it('retries an unresolved initial load on a same-content save', async () => {
        const selected = fragment('fragment-id');
        fetchFragmentSummaries
            .mockResolvedValueOnce(err(new Error('unavailable')))
            .mockResolvedValueOnce(ok([selected]));
        $context.set(context());
        initFragmentInspectionService();
        await vi.waitFor(() => expect($isFragmentInspectionLoading.get()).toBe(false));
        expect($areFragmentOptionsResolved.get()).toBe(false);

        $context.set(context());
        initFragmentInspectionService();
        await vi.waitFor(() => expect($fragmentOptions.get()).toEqual([selected]));
        expect(fetchFragmentSummaries).toHaveBeenCalledTimes(2);
    });

    it('keeps previous options on fragment refresh failure and accepts confirmed removal', async () => {
        const selected = fragment('fragment-id');
        fetchFragmentSummaries.mockResolvedValueOnce(ok([selected]));
        $context.set(context());
        initFragmentInspectionService();
        await vi.waitFor(() => expect($isFragmentInspectionLoading.get()).toBe(false));

        const pending = deferred<FragmentResult>();
        fetchFragmentSummaries.mockReturnValueOnce(pending.promise);
        vi.useFakeTimers();
        $updated.set({ timestamp: 1, data: [selected] });
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();
        expect($fragmentOptions.get()).toEqual([selected]);
        pending.resolve(err(new Error('unavailable')));
        await vi.waitFor(() => expect($isFragmentInspectionLoading.get()).toBe(false));
        expect($fragmentOptions.get()).toEqual([selected]);
        expect($areFragmentOptionsResolved.get()).toBe(true);

        fetchFragmentSummaries.mockResolvedValueOnce(ok([]));
        vi.useFakeTimers();
        $updated.set({ timestamp: 2, data: [selected] });
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();
        await vi.waitFor(() => expect($fragmentOptions.get()).toEqual([]));
    });

    it('clears a true scope change and ignores the old response', async () => {
        const selected = fragment('old-fragment');
        const pending = deferred<FragmentResult>();
        fetchFragmentSummaries.mockReturnValueOnce(pending.promise);
        $context.set(context());
        initFragmentInspectionService();
        await vi.waitFor(() => expect(fetchFragmentSummaries).toHaveBeenCalledTimes(1));

        fetchFragmentSummaries.mockResolvedValueOnce(ok([fragment('new-fragment')]));
        $context.set(context('other-content', '/other-site'));
        expect($fragmentOptions.get()).toEqual([]);
        await vi.waitFor(() => expect($fragmentOptions.get()[0]?.getId()).toBe('new-fragment'));
        pending.resolve(ok([selected]));
        await Promise.resolve();
        expect($fragmentOptions.get()[0]?.getId()).toBe('new-fragment');
    });

    it('keeps the selected fragment while a site path change reloads the list', async () => {
        const selected = fragment('fragment-id');
        fetchFragmentSummaries.mockResolvedValueOnce(ok([selected]));
        $context.set(context());
        initFragmentInspectionService();
        await vi.waitFor(() => expect($fragmentOptions.get()).toEqual([selected]));

        const pending = deferred<FragmentResult>();
        fetchFragmentSummaries.mockReturnValueOnce(pending.promise);
        $context.set(context('content-id', '/renamed-site'));

        expect(fetchFragmentSummaries).toHaveBeenLastCalledWith('/renamed-site', expect.any(AbortSignal));
        expect($fragmentOptions.get()).toEqual([selected]);
        expect($areFragmentOptionsResolved.get()).toBe(true);
        expect($isFragmentInspectionLoading.get()).toBe(true);

        pending.resolve(ok([]));
        await vi.waitFor(() => expect($fragmentOptions.get()).toEqual([]));
    });
});
