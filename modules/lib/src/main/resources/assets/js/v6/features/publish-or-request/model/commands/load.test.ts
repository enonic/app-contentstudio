import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import {
    $hasMorePublishOrRequestDependants,
    $publishOrRequestDialog,
    INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
} from '../publishOrRequestDialog.store';
import {
    cancelPublishOrRequestDialogLoad,
    loadMorePublishOrRequestDependants,
    loadPublishOrRequestDialogData,
} from './load';

const { mockResolvePublishDependencies, mockFetchContentSummaries } = vi.hoisted(() => ({
    mockResolvePublishDependencies: vi.fn(),
    mockFetchContentSummaries: vi.fn(),
}));

vi.mock('../../../../entities/content/api/publish.api', () => ({
    resolvePublishDependencies: mockResolvePublishDependencies,
}));

vi.mock('../../../../entities/content', () => ({
    fetchContentSummaries: mockFetchContentSummaries,
}));

const createItem = (id: string): ContentSummary =>
    ({ getId: () => id, getContentId: () => new ContentId(id) }) as unknown as ContentSummary;

const createIds = (count: number): ContentId[] => Array.from({ length: count }, (_, i) => new ContentId(`d${i}`));

const toItems = (ids: ContentId[]): ContentSummary[] => ids.map((id) => createItem(id.toString()));

type Resolved = { getDependants: () => ContentId[]; getRequired: () => ContentId[] };

const createResolved = (dependantIds: ContentId[], requiredIds: ContentId[] = []): Resolved => ({
    getDependants: () => dependantIds,
    getRequired: () => requiredIds,
});

const mockResolved = (dependantIds: ContentId[], requiredIds: ContentId[] = []): void => {
    mockResolvePublishDependencies.mockReturnValue(okAsync(createResolved(dependantIds, requiredIds)));
};

const openWith = (...ids: string[]): void => {
    $publishOrRequestDialog.set({
        ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
        open: true,
        items: ids.map(createItem),
    });
};

const exclude = (applied: ContentId[], staged: ContentId[] = applied): void => {
    $publishOrRequestDialog.setKey('appliedExcludedDependantIds', applied);
    $publishOrRequestDialog.setKey('excludedDependantIds', staged);
};

describe('publish or request dialog load commands', () => {
    beforeEach(() => {
        mockResolvePublishDependencies.mockReset();
        mockFetchContentSummaries.mockReset();
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => Promise.resolve(toItems(ids)));
        openWith('a');
    });

    afterEach(() => {
        cancelPublishOrRequestDialogLoad();
        vi.restoreAllMocks();
    });

    describe('loadPublishOrRequestDialogData', () => {
        it('should resolve the dependencies of the items without their children', async () => {
            mockResolved([]);

            await loadPublishOrRequestDialogData();

            const [params] = mockResolvePublishDependencies.mock.calls[0];
            expect(params.ids.map(String)).toEqual(['a']);
            expect(params.excludeChildrenIds.map(String)).toEqual(['a']);
        });

        it('should resolve once when no dependency is excluded', async () => {
            mockResolved(createIds(2));

            await loadPublishOrRequestDialogData();

            expect(mockResolvePublishDependencies).toHaveBeenCalledOnce();
        });

        it('should resolve a second time with the applied exclusions, not the staged ones', async () => {
            const ids = createIds(3);
            exclude([ids[2]], [ids[1], ids[2]]);
            mockResolved(ids);

            await loadPublishOrRequestDialogData();

            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
            const [first] = mockResolvePublishDependencies.mock.calls[0];
            const [second] = mockResolvePublishDependencies.mock.calls[1];
            expect(first.excludedIds).toBeUndefined();
            expect(second.excludedIds.map(String)).toEqual(['d2']);
        });

        it('should list every dependency and take the required ones from the second answer', async () => {
            const ids = createIds(3);
            exclude([ids[2]]);
            mockResolvePublishDependencies
                .mockReturnValueOnce(okAsync(createResolved(ids, [ids[0], ids[1]])))
                .mockReturnValueOnce(okAsync(createResolved([ids[0], ids[1]], [ids[0]])));

            await loadPublishOrRequestDialogData();

            const { dependantIds, requiredDependantIds, excludedDependantIds } = $publishOrRequestDialog.get();
            expect(dependantIds).toEqual(ids);
            expect(requiredDependantIds).toEqual([ids[0]]);
            expect(excludedDependantIds).toEqual([ids[2]]);
        });

        it('should drop the exclusions of dependencies that are gone or have become required', async () => {
            const ids = createIds(3);
            const gone = new ContentId('gone');
            exclude([ids[0], gone], [ids[0], ids[1], gone]);
            mockResolved(ids, [ids[0]]);

            await loadPublishOrRequestDialogData();

            const { excludedDependantIds, appliedExcludedDependantIds } = $publishOrRequestDialog.get();
            expect(excludedDependantIds).toEqual([ids[1]]);
            expect(appliedExcludedDependantIds).toEqual([]);
        });

        it('should keep the list shown while it loads again', async () => {
            const ids = createIds(2);
            mockResolved(ids);
            await loadPublishOrRequestDialogData();

            const load = loadPublishOrRequestDialogData();

            expect($publishOrRequestDialog.get()).toMatchObject({ loading: true, dependantIds: ids });
            await load;
        });

        it('should mark the load as failed when the second resolve fails', async () => {
            const ids = createIds(2);
            exclude([ids[1]]);
            mockResolvePublishDependencies
                .mockReturnValueOnce(okAsync(createResolved(ids)))
                .mockReturnValueOnce(errAsync(new Error('boom')));

            await loadPublishOrRequestDialogData();

            expect($publishOrRequestDialog.get()).toMatchObject({ loading: false, failed: true });
        });

        it('should store the dependency ids and their summaries in the resolved order', async () => {
            const ids = createIds(2);
            mockResolved(ids);
            mockFetchContentSummaries.mockResolvedValue(toItems([...ids].reverse()));

            await loadPublishOrRequestDialogData();

            const { dependants, dependantIds, dependantWindow, loading, failed } = $publishOrRequestDialog.get();
            expect(dependantIds).toEqual(ids);
            expect(dependants.map((item) => item.getId())).toEqual(['d0', 'd1']);
            expect(dependantWindow).toBe(2);
            expect(loading).toBe(false);
            expect(failed).toBe(false);
        });

        it('should store which dependencies are required', async () => {
            const ids = createIds(3);
            mockResolved(ids, [ids[1]]);

            await loadPublishOrRequestDialogData();

            expect($publishOrRequestDialog.get().requiredDependantIds).toEqual([ids[1]]);
        });

        it('should report loading while the load runs', async () => {
            mockResolved([]);

            const load = loadPublishOrRequestDialogData();

            expect($publishOrRequestDialog.get().loading).toBe(true);
            await load;
            expect($publishOrRequestDialog.get().loading).toBe(false);
        });

        it('should not ask the server when there are no items', async () => {
            openWith();

            await loadPublishOrRequestDialogData();

            expect(mockResolvePublishDependencies).not.toHaveBeenCalled();
            expect($publishOrRequestDialog.get().loading).toBe(false);
        });

        it('should mark the load as failed when the dependencies cannot be resolved', async () => {
            mockResolvePublishDependencies.mockReturnValue(errAsync(new Error('boom')));

            await loadPublishOrRequestDialogData();

            expect($publishOrRequestDialog.get()).toMatchObject({ loading: false, failed: true, dependants: [] });
        });

        it('should mark the load as failed when the summaries cannot be loaded', async () => {
            mockResolved(createIds(2));
            mockFetchContentSummaries.mockResolvedValue([]);

            await loadPublishOrRequestDialogData();

            expect($publishOrRequestDialog.get()).toMatchObject({ loading: false, failed: true, dependants: [] });
        });

        it('should ignore the answer of a cancelled load', async () => {
            let answer: (value: Resolved) => void = () => undefined;
            const pending = new Promise<Resolved>((resolve) => (answer = resolve));
            mockResolvePublishDependencies.mockReturnValue(ResultAsync.fromSafePromise(pending));

            const load = loadPublishOrRequestDialogData();
            cancelPublishOrRequestDialogLoad();
            answer(createResolved(createIds(2)));
            await load;

            expect($publishOrRequestDialog.get().dependantIds).toEqual([]);
            expect(mockFetchContentSummaries).not.toHaveBeenCalled();
        });
    });

    describe('loadMorePublishOrRequestDependants', () => {
        it('should load one window first and the rest on demand', async () => {
            const ids = createIds(40);
            mockResolved(ids);

            await loadPublishOrRequestDialogData();

            expect($publishOrRequestDialog.get().dependants).toHaveLength(36);
            expect($hasMorePublishOrRequestDependants.get()).toBe(true);

            await loadMorePublishOrRequestDependants();

            expect($publishOrRequestDialog.get().dependants).toHaveLength(40);
            expect($hasMorePublishOrRequestDependants.get()).toBe(false);
        });

        it('should do nothing when everything is loaded', async () => {
            mockResolved(createIds(2));
            await loadPublishOrRequestDialogData();
            mockFetchContentSummaries.mockClear();

            await loadMorePublishOrRequestDependants();

            expect(mockFetchContentSummaries).not.toHaveBeenCalled();
        });
    });
});
