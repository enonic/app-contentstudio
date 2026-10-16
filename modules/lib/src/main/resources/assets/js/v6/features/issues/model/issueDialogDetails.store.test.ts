import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { err, errAsync, ok, okAsync, type Result } from 'neverthrow';
import { NodeServerChangeType } from '@enonic/lib-admin-ui/event/NodeServerChange';
import { ContentId } from '../../../../app/content/ContentId';
import type { IssueServerEvent } from '../../../../app/event/IssueServerEvent';
import type { Issue } from '../../../../app/issue/Issue';
import { IssueStatus } from '../../../../app/issue/IssueStatus';
import { IssueType } from '../../../../app/issue/IssueType';
import type { IssueWithAssignees } from '../../../../app/issue/IssueWithAssignees';
import {
    emitContentArchived,
    emitContentCreated,
    emitContentDeleted,
    emitContentPublished,
    emitContentUpdated,
} from '../../../shared/socket/socket.store';
import { $issueDialog, closeIssueDialog, openIssueDialogDetails } from './issueDialog.store';
import { start as startIssueDialogDetailsService } from './issueDialogDetails.service';
import {
    $isIssueDialogDetailsSelectionSynced,
    $issueDialogDetails,
    $issueDialogDetailsDependantsSelection,
    $issueDialogDetailsHasExcludedDependants,
    $issueDialogDetailsHasMoreDependants,
    $showIssueDialogDetailsExcludedDependants,
    applyDraftIssueDialogDetailsSelection,
    cancelDraftIssueDialogDetailsSelection,
    loadIssueDialogItems,
    loadMoreIssueDialogDependants,
    resetIssueDialogDetails,
    setIssueDialogDetailsDependantIncluded,
    setIssueDialogDetailsItemIncludeChildren,
    toggleIssueDialogDetailsDependantsSelection,
    toggleIssueDialogDetailsShowExcludedDependants,
    updateIssueDialogExcludedDependants,
    updateIssueDialogItems,
    updateIssueDialogTitle,
} from './issueDialogDetails.store';
import {
    createDeferredPromise,
    createMockChangeItem,
    createMockContent,
    createResolveResult,
    flushDebouncedReload,
    flushPromises,
} from '../../../shared/lib/test/dialog.store.test.utils';

const {
    mockFetchContentSummaries,
    mockResolvePublishDependencies,
    mockShowError,
    mockShowFeedback,
    mockIssueServerEventsHandler,
    mockFetchIssue,
    mockListIssueComments,
    mockUpdateIssue,
} = vi.hoisted(() => ({
    mockFetchContentSummaries: vi.fn(),
    mockResolvePublishDependencies: vi.fn(),
    mockShowError: vi.fn(),
    mockShowFeedback: vi.fn(),
    mockIssueServerEventsHandler: {
        onIssueCreated: vi.fn(),
        onIssueUpdated: vi.fn(),
        onIssueChanged: vi.fn(),
        unIssueChanged: vi.fn(),
    },
    mockFetchIssue: vi.fn(),
    mockListIssueComments: vi.fn(),
    mockUpdateIssue: vi.fn(),
}));

vi.mock('../../../entities/content/lib/contentSummaries', () => ({
    fetchContentSummaries: mockFetchContentSummaries,
}));

vi.mock('../../../entities/content/api/publish.api', () => ({
    resolvePublishDependencies: mockResolvePublishDependencies,
}));

vi.mock('../../../../app/issue/event/IssueServerEventsHandler', () => ({
    IssueServerEventsHandler: {
        getInstance: () => mockIssueServerEventsHandler,
    },
}));

vi.mock('../../../entities/issue/api/issues.api', () => ({
    fetchIssue: mockFetchIssue,
    listIssueComments: mockListIssueComments,
    listIssues: () => okAsync({ issues: [], totalHits: 0 }),
    updateIssue: mockUpdateIssue,
    createIssueComment: () => okAsync(undefined),
    updateIssueComment: () => okAsync(undefined),
    deleteIssueComment: () => okAsync(true),
}));

vi.mock('../../../entities/issue/api/issuesStats.api', () => ({
    fetchIssueStats: () => okAsync({}),
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showError: mockShowError,
    showFeedback: mockShowFeedback,
}));

vi.mock('../../../shared/i18n', () => ({
    i18n: (key: string) => key,
}));

type MockIssueSelection = {
    excludeChildrenIds?: ContentId[];
    excludeIds?: ContentId[];
    title?: string;
};

function createMockIssue(issueId: string, itemIds: ContentId[], selection: MockIssueSelection = {}): Issue {
    const { excludeChildrenIds = [], excludeIds = [], title = 'Issue' } = selection;
    const isChildrenExcluded = (id: ContentId): boolean =>
        excludeChildrenIds.some((item) => item.toString() === id.toString());

    const publishRequest = {
        getItems: () =>
            itemIds.map((id) => ({
                getId: () => id,
                isIncludeChildren: () => !isChildrenExcluded(id),
            })),
        getItemsIds: () => itemIds,
        getExcludeChildrenIds: () => excludeChildrenIds,
        getExcludeIds: () => excludeIds,
    };

    return {
        getId: () => issueId,
        getType: () => IssueType.PUBLISH_REQUEST,
        getIssueStatus: () => IssueStatus.OPEN,
        getTitle: () => title,
        getDescription: () => '',
        getApprovers: () => [],
        getPublishFrom: () => undefined,
        getPublishTo: () => undefined,
        getPublishRequest: () => publishRequest,
    } as unknown as Issue;
}

function createMockIssueWithAssignees(issue: Issue): IssueWithAssignees {
    return {
        getIssue: () => issue,
        getAssignees: () => [],
    } as unknown as IssueWithAssignees;
}

async function openListBackedIssueDetails(issue: Issue): Promise<void> {
    openIssueDialogDetails(issue.getId());
    await flushPromises();
    $issueDialog.set({
        ...$issueDialog.get(),
        issues: [createMockIssueWithAssignees(issue)],
    });

    await loadIssueDialogItems(issue);
}

const removalEventCases = [
    {
        name: 'deleted',
        emit: (id: string) => emitContentDeleted([createMockChangeItem(id)]),
    },
    {
        name: 'archived',
        emit: (id: string) => emitContentArchived([createMockChangeItem(id)]),
    },
] as const;

describe('issueDialogDetails.store', () => {
    beforeEach(() => {
        startIssueDialogDetailsService();
        vi.useFakeTimers();
        closeIssueDialog();
        mockFetchContentSummaries.mockReset().mockResolvedValue([]);
        mockResolvePublishDependencies.mockReset().mockResolvedValue(createResolveResult({}));
        mockShowError.mockReset();
        mockShowFeedback.mockReset();
        mockFetchIssue.mockReset();
        mockListIssueComments.mockReset();
        // Echo the submitted publish request back as the updated issue, the way the server does.
        mockUpdateIssue.mockReset().mockImplementation(({ id, publishRequest }) =>
            okAsync(
                createMockIssue(id, publishRequest.getItemsIds(), {
                    excludeChildrenIds: publishRequest.getExcludeChildrenIds(),
                    excludeIds: publishRequest.getExcludeIds(),
                }),
            ),
        );
    });

    afterEach(() => {
        closeIssueDialog();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('reloads items for list-backed issue details on tracked content updates', async () => {
        const itemId = new ContentId('item-1');
        const issue = createMockIssue('issue-1', [itemId]);
        const original = createMockContent('item-1', { displayName: 'Original' });
        const updated = createMockContent('item-1', { displayName: 'Updated' });
        let fetchedItems = [original];

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some((id) => id.toString() === 'item-1') ? fetchedItems : [];
        });

        await openListBackedIssueDetails(issue);

        expect($issueDialogDetails.get().issue).toBeUndefined();
        expect($issueDialogDetails.get().items[0].getDisplayName()).toBe('Original');
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);

        fetchedItems = [updated];

        emitContentUpdated([updated]);
        await flushPromises();

        expect($issueDialogDetails.get().items[0].getDisplayName()).toBe('Updated');
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });

    it('reloads list-backed issue details when content is created below a tracked item', async () => {
        const itemId = new ContentId('item-1');
        const issue = createMockIssue('issue-1', [itemId]);
        const parent = createMockContent('item-1', { displayName: 'Parent', path: '/parent' });
        const updatedParent = createMockContent('item-1', {
            displayName: 'Parent',
            path: '/parent',
            hasChildren: true,
        });
        const unrelated = createMockContent('item-2', { displayName: 'Elsewhere', path: '/other/child' });
        const child = createMockContent('item-3', { displayName: 'Child', path: '/parent/child' });
        let fetchedItems = [parent];

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some((id) => id.toString() === 'item-1') ? fetchedItems : [];
        });

        await openListBackedIssueDetails(issue);

        emitContentCreated([unrelated]);
        await flushPromises();

        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
        expect($issueDialogDetails.get().items[0].hasChildren()).toBe(false);

        fetchedItems = [updatedParent];

        emitContentCreated([child]);
        await flushPromises();

        expect($issueDialogDetails.get().items[0].hasChildren()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });

    it.each(removalEventCases)('removes and reloads list-backed issue details on $name events', async ({ emit }) => {
        const itemId = new ContentId('item-1');
        const issue = createMockIssue('issue-1', [itemId]);
        const original = createMockContent('item-1', { displayName: 'Original' });
        let fetchedItems = [original];

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some((id) => id.toString() === 'item-1') ? fetchedItems : [];
        });

        await openListBackedIssueDetails(issue);

        fetchedItems = [];
        emit('item-1');
        await flushPromises();

        expect($issueDialogDetails.get().items).toEqual([]);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });

    it('patches and reloads list-backed issue details on published events', async () => {
        const itemId = new ContentId('item-1');
        const issue = createMockIssue('issue-1', [itemId]);
        const original = createMockContent('item-1', { displayName: 'Original' });
        const published = createMockContent('item-1', { displayName: 'Published', isOnline: true });
        let fetchedItems = [original];

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some((id) => id.toString() === 'item-1') ? fetchedItems : [];
        });

        await openListBackedIssueDetails(issue);

        fetchedItems = [published];
        emitContentPublished([published]);
        await flushPromises();

        expect($issueDialogDetails.get().items[0].getDisplayName()).toBe('Published');
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });

    it('loads dependant summaries lazily, a window at a time, while the id set stays complete', async () => {
        const itemId = new ContentId('item-1');
        const issue = createMockIssue('issue-1', [itemId]);
        const dependantIds = Array.from({ length: 40 }, (_, index) => new ContentId(`dep-${index}`));

        mockResolvePublishDependencies.mockResolvedValue(createResolveResult({ dependants: dependantIds }));
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
            ids.map((id) => createMockContent(id.toString())),
        );

        await openListBackedIssueDetails(issue);

        expect($issueDialogDetails.get().dependantIds).toHaveLength(40);
        expect($issueDialogDetails.get().dependants).toHaveLength(36);
        expect($issueDialogDetailsHasMoreDependants.get()).toBe(true);

        await loadMoreIssueDialogDependants();

        expect($issueDialogDetails.get().dependants).toHaveLength(40);
        expect($issueDialogDetailsHasMoreDependants.get()).toBe(false);
    });

    describe('issue server events', () => {
        const captureIssueChangedListener = (): ((issueIds: string[], event: IssueServerEvent) => void) => {
            const listener = mockIssueServerEventsHandler.onIssueChanged.mock.calls.at(-1)?.[0];
            expect(listener).toBeTypeOf('function');
            return listener as (issueIds: string[], event: IssueServerEvent) => void;
        };

        const createServerEvent = (type: NodeServerChangeType): IssueServerEvent => {
            return { getType: () => type } as unknown as IssueServerEvent;
        };

        it('reloads issue details when the current issue changes on the server', async () => {
            const issueId = 'issue-id-1';
            const serverIssue = {
                getId: () => issueId,
                getName: () => 'issue-1',
                getType: () => IssueType.STANDARD,
                getIssueStatus: () => IssueStatus.OPEN,
                getApprovers: () => [],
                getPublishRequest: () => null,
            } as unknown as Issue;

            mockFetchIssue.mockReturnValue(okAsync(serverIssue));
            mockListIssueComments.mockReturnValue(okAsync([{ getId: () => 'comment-1' }]));

            openIssueDialogDetails(issueId);
            await flushPromises();

            const unsubscribe = $issueDialogDetails.subscribe(() => {
                /* mount the store */
            });
            const notifyIssueChanged = captureIssueChangedListener();

            notifyIssueChanged([issueId], createServerEvent(NodeServerChangeType.UPDATE));
            await flushDebouncedReload(1250, 10);

            expect(mockFetchIssue).toHaveBeenCalledWith(issueId);
            expect($issueDialogDetails.get().comments).toHaveLength(1);
            expect($issueDialogDetails.get().commentsIssueId).toBe(issueId);

            unsubscribe();
        });

        it('should preserve another editor’s exclusions when children are toggled before comments reload', async () => {
            const item1 = new ContentId('item-1');
            const item2 = new ContentId('item-2');
            const dep1 = new ContentId('dep-1');
            const issueId = 'issue-1';
            const issue = createMockIssue(issueId, [item1, item2]);
            const changedIssue = createMockIssue(issueId, [item1, item2], {
                excludeChildrenIds: [item2],
                excludeIds: [dep1],
            });
            const comments = createDeferredPromise<Result<unknown[], Error>>();

            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({ dependants: [dep1] }));
            mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
                ids.map((id) => createMockContent(id.toString())),
            );
            await openListBackedIssueDetails(issue);

            const unsubscribe = $issueDialogDetails.subscribe(() => {
                /* mount the store */
            });
            mockFetchIssue.mockReturnValue(okAsync(changedIssue));
            mockListIssueComments.mockReturnValue(comments.promise);

            captureIssueChangedListener()([issueId], createServerEvent(NodeServerChangeType.UPDATE));
            await flushDebouncedReload(1250, 10);

            expect($issueDialogDetails.get().appliedExcludedDependantIds).toEqual([dep1]);
            expect($issueDialogDetails.get().commentsLoading).toBe(true);

            await setIssueDialogDetailsItemIncludeChildren(item1, false);

            const { publishRequest } = mockUpdateIssue.mock.calls[0][0];
            expect(publishRequest.getExcludeChildrenIds()).toEqual([item1, item2]);
            expect(publishRequest.getExcludeIds()).toEqual([dep1]);

            comments.resolve(ok([]));
            await flushPromises();
            unsubscribe();
        });

        it('closes the dialog when the current issue is deleted on the server', async () => {
            const issueId = 'issue-id-2';

            openIssueDialogDetails(issueId);
            await flushPromises();

            const unsubscribe = $issueDialogDetails.subscribe(() => {
                /* mount the store */
            });
            const notifyIssueChanged = captureIssueChangedListener();

            expect($issueDialog.get().open).toBe(true);

            notifyIssueChanged([issueId], createServerEvent(NodeServerChangeType.DELETE));

            expect($issueDialog.get().open).toBe(false);
            expect(mockFetchIssue).not.toHaveBeenCalled();

            unsubscribe();
        });
    });

    describe('batch dependant selection', () => {
        it('derives the tri-state from required and excluded dependants', () => {
            $issueDialogDetails.setKey('dependantIds', [new ContentId('req'), new ContentId('a'), new ContentId('b')]);
            $issueDialogDetails.setKey('requiredDependantIds', [new ContentId('req')]);
            $issueDialogDetails.setKey('excludedDependantIds', [new ContentId('a')]);

            const selection = $issueDialogDetailsDependantsSelection.get();
            expect(selection.count).toBe(3);
            expect(selection.selectionType).toBe('partial');
            expect(selection.disabled).toBe(false);
        });

        it('is checked and disabled when every dependant is required', () => {
            $issueDialogDetails.setKey('dependantIds', [new ContentId('a'), new ContentId('b')]);
            $issueDialogDetails.setKey('requiredDependantIds', [new ContentId('a'), new ContentId('b')]);
            $issueDialogDetails.setKey('excludedDependantIds', []);

            const selection = $issueDialogDetailsDependantsSelection.get();
            expect(selection.selectionType).toBe('all');
            expect(selection.disabled).toBe(true);
        });
    });

    describe('draft selection', () => {
        const item1 = new ContentId('item-1');
        const dep1 = new ContentId('dep-1');
        const dep2 = new ContentId('dep-2');

        async function openWithDependants(): Promise<Issue> {
            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({ dependants: [dep1, dep2] }));
            mockFetchContentSummaries.mockImplementation((contentIds: ContentId[]) =>
                contentIds.map((id) => createMockContent(id.toString())),
            );

            const issue = createMockIssue('issue-1', [item1]);
            await openListBackedIssueDetails(issue);
            await flushPromises();

            return issue;
        }

        it('should save an include-children toggle immediately and reload dependants', async () => {
            await openWithDependants();
            mockResolvePublishDependencies.mockClear();

            await setIssueDialogDetailsItemIncludeChildren(item1, false);

            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(true);
            expect($issueDialogDetails.get().excludeChildrenIds.map((id) => id.toString())).toEqual(['item-1']);
            expect($issueDialogDetails.get().appliedExcludeChildrenIds.map((id) => id.toString())).toEqual(['item-1']);
            expect($issueDialogDetails.get().itemsUpdating).toBe(false);
            expect(mockUpdateIssue).toHaveBeenCalledTimes(1);
            expect(mockUpdateIssue.mock.calls[0][0].publishRequest.getExcludeChildrenIds()).toEqual([item1]);
            expect(mockResolvePublishDependencies.mock.lastCall?.[0].excludeChildrenIds).toEqual([item1]);

            await setIssueDialogDetailsItemIncludeChildren(item1, true);
            expect(mockUpdateIssue).toHaveBeenCalledTimes(2);
            expect(mockUpdateIssue.mock.calls[1][0].publishRequest.getExcludeChildrenIds()).toHaveLength(0);
            expect($issueDialogDetails.get().excludeChildrenIds).toHaveLength(0);
            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(true);
        });

        it('saves a child toggle after an in-flight title edit using the updated title', async () => {
            await openWithDependants();
            const titleSave = createDeferredPromise<Result<Issue, Error>>();
            mockUpdateIssue.mockImplementation(({ id, title, publishRequest }) => {
                if (!publishRequest) {
                    return titleSave.promise;
                }
                return okAsync(
                    createMockIssue(id, publishRequest.getItemsIds(), {
                        title,
                        excludeChildrenIds: publishRequest.getExcludeChildrenIds(),
                    }),
                );
            });

            const titleUpdate = updateIssueDialogTitle('Renamed');
            const toggle = setIssueDialogDetailsItemIncludeChildren(item1, false);
            expect(mockUpdateIssue).toHaveBeenCalledTimes(1);

            titleSave.resolve(ok(createMockIssue('issue-1', [item1], { title: 'Renamed' })));
            await titleUpdate;
            await toggle;

            expect(mockUpdateIssue).toHaveBeenCalledTimes(2);
            expect(mockUpdateIssue.mock.calls[1][0].title).toBe('Renamed');
            expect($issueDialogDetails.get().issue?.getTitle()).toBe('Renamed');
            expect($issueDialogDetails.get().appliedExcludeChildrenIds).toEqual([item1]);
        });

        it('saves a title edit after an in-flight child toggle', async () => {
            await openWithDependants();
            const childSave = createDeferredPromise<Result<Issue, Error>>();
            mockUpdateIssue
                .mockReturnValueOnce(childSave.promise)
                .mockImplementation(({ id, title }) =>
                    okAsync(createMockIssue(id, [item1], { title, excludeChildrenIds: [item1] })),
                );

            const toggle = setIssueDialogDetailsItemIncludeChildren(item1, false);
            const titleUpdate = updateIssueDialogTitle('Renamed');
            expect(mockUpdateIssue).toHaveBeenCalledTimes(1);

            childSave.resolve(ok(createMockIssue('issue-1', [item1], { excludeChildrenIds: [item1] })));
            await toggle;
            await titleUpdate;

            expect(mockUpdateIssue).toHaveBeenCalledTimes(2);
            expect(mockUpdateIssue.mock.calls[1][0].title).toBe('Renamed');
        });

        it('drops queued edits and stale save results after the dialog resets', async () => {
            await openWithDependants();
            const childSave = createDeferredPromise<Result<Issue, Error>>();
            mockUpdateIssue.mockReturnValueOnce(childSave.promise);

            const toggle = setIssueDialogDetailsItemIncludeChildren(item1, false);
            const titleUpdate = updateIssueDialogTitle('Renamed');
            resetIssueDialogDetails('issue-1');

            childSave.resolve(ok(createMockIssue('issue-1', [item1], { excludeChildrenIds: [item1] })));
            await toggle;
            await titleUpdate;

            expect(mockUpdateIssue).toHaveBeenCalledTimes(1);
            expect($issueDialogDetails.get().issue).toBeUndefined();
            expect($issueDialogDetails.get().itemsUpdating).toBe(false);
        });

        it('keeps loading while an older resolve settles during a children save', async () => {
            const issue = await openWithDependants();
            const oldResolve = createDeferredPromise<ReturnType<typeof createResolveResult>>();
            const save = createDeferredPromise<Result<Issue, Error>>();
            mockResolvePublishDependencies.mockReturnValueOnce(oldResolve.promise);
            mockUpdateIssue.mockReturnValueOnce(save.promise);

            const olderReload = loadIssueDialogItems(issue);
            expect($issueDialogDetails.get().itemsLoading).toBe(true);

            const toggle = setIssueDialogDetailsItemIncludeChildren(item1, false);
            expect($issueDialogDetails.get().itemsUpdating).toBe(true);
            expect($issueDialogDetails.get().itemsLoading).toBe(true);

            oldResolve.resolve(createResolveResult({ dependants: [dep1] }));
            await olderReload;
            expect($issueDialogDetails.get().itemsLoading).toBe(true);
            expect($issueDialogDetails.get().appliedExcludeChildrenIds).toEqual([item1]);

            const resolveCount = mockResolvePublishDependencies.mock.calls.length;
            await loadIssueDialogItems(issue);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(resolveCount);

            save.resolve(ok(createMockIssue('issue-1', [item1], { excludeChildrenIds: [item1] })));
            await toggle;
            expect($issueDialogDetails.get().itemsLoading).toBe(false);
            expect($issueDialogDetails.get().itemsUpdating).toBe(false);
            expect(mockResolvePublishDependencies.mock.lastCall?.[0].excludeChildrenIds).toEqual([item1]);
        });

        it('replays an older resolve when the children save fails', async () => {
            const issue = await openWithDependants();
            const oldResolve = createDeferredPromise<ReturnType<typeof createResolveResult>>();
            const save = createDeferredPromise<Result<Issue, Error>>();
            mockResolvePublishDependencies
                .mockClear()
                .mockResolvedValue(createResolveResult({ dependants: [dep1] }))
                .mockReturnValueOnce(oldResolve.promise);
            mockUpdateIssue.mockReturnValueOnce(save.promise);

            const olderReload = loadIssueDialogItems(issue);
            expect($issueDialogDetails.get().itemsLoading).toBe(true);
            await flushPromises();
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
            const toggle = setIssueDialogDetailsItemIncludeChildren(item1, false);
            expect($issueDialogDetails.get().itemsUpdating).toBe(true);

            oldResolve.resolve(createResolveResult({ dependants: [dep1, dep2] }));
            await olderReload;
            expect($issueDialogDetails.get().itemsLoading).toBe(true);

            save.resolve(err(new Error('save failed')));
            await toggle;

            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
            expect(mockResolvePublishDependencies.mock.lastCall?.[0].excludeChildrenIds).toHaveLength(0);
            expect($issueDialogDetails.get().dependantIds).toEqual([dep1]);
            expect($issueDialogDetails.get().itemsLoading).toBe(false);
        });

        it('replays a queued item reload after a failed children save', async () => {
            const issue = await openWithDependants();
            const save = createDeferredPromise<Result<Issue, Error>>();
            mockUpdateIssue.mockReturnValueOnce(save.promise);
            const resolveCount = mockResolvePublishDependencies.mock.calls.length;

            const toggle = setIssueDialogDetailsItemIncludeChildren(item1, false);
            await loadIssueDialogItems(issue, { forceReload: true });
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(resolveCount);

            save.resolve(err(new Error('save failed')));
            await toggle;

            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(resolveCount + 1);
            expect(mockResolvePublishDependencies.mock.lastCall?.[0].excludeChildrenIds).toHaveLength(0);
            expect($issueDialogDetails.get().appliedExcludeChildrenIds).toHaveLength(0);
            expect($issueDialogDetails.get().itemsLoading).toBe(false);
        });

        it('replays a queued item reload after a successful children save', async () => {
            const issue = await openWithDependants();
            const save = createDeferredPromise<Result<Issue, Error>>();
            mockUpdateIssue.mockReturnValueOnce(save.promise);
            const resolveCount = mockResolvePublishDependencies.mock.calls.length;

            const toggle = setIssueDialogDetailsItemIncludeChildren(item1, false);
            await loadIssueDialogItems(issue, { forceReload: true });
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(resolveCount);

            save.resolve(ok(createMockIssue('issue-1', [item1], { excludeChildrenIds: [item1] })));
            await toggle;

            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(resolveCount + 2);
            expect(mockResolvePublishDependencies.mock.lastCall?.[0].excludeChildrenIds).toEqual([item1]);
            expect($issueDialogDetails.get().itemsLoading).toBe(false);
        });

        it('can retry dependency loading after the children save succeeds', async () => {
            await openWithDependants();
            mockResolvePublishDependencies.mockReturnValueOnce(err(new Error('resolve failed')));

            await setIssueDialogDetailsItemIncludeChildren(item1, false);

            expect($issueDialogDetails.get().itemsError).toBe(true);
            expect($issueDialogDetails.get().itemsUpdating).toBe(false);
            expect($issueDialogDetails.get().appliedExcludeChildrenIds).toEqual([item1]);

            await loadIssueDialogItems($issueDialogDetails.get().issue, { forceReload: true });

            expect($issueDialogDetails.get().itemsError).toBe(false);
            expect(mockResolvePublishDependencies.mock.lastCall?.[0].excludeChildrenIds).toEqual([item1]);
        });

        it('should stage a dependant exclusion and update the tri-state live', async () => {
            await openWithDependants();

            setIssueDialogDetailsDependantIncluded(dep1, false);

            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(false);
            expect($issueDialogDetailsDependantsSelection.get().selectionType).toBe('partial');
            expect(mockUpdateIssue).not.toHaveBeenCalled();
        });

        it('should stage the batch dependants toggle without saving', async () => {
            await openWithDependants();

            toggleIssueDialogDetailsDependantsSelection();

            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(false);
            expect($issueDialogDetails.get().excludedDependantIds).toHaveLength(2);
            expect(mockUpdateIssue).not.toHaveBeenCalled();
        });

        it('should ignore a dependant toggle on a required dependant', async () => {
            await openWithDependants();
            $issueDialogDetails.setKey('requiredDependantIds', [dep1]);

            setIssueDialogDetailsDependantIncluded(dep1, false);

            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(true);
        });

        it('should apply a staged dependant edit after an immediate children toggle', async () => {
            await openWithDependants();

            setIssueDialogDetailsDependantIncluded(dep1, false);
            await setIssueDialogDetailsItemIncludeChildren(item1, false);

            expect(mockUpdateIssue.mock.calls[0][0].publishRequest.getExcludeIds()).toHaveLength(0);
            expect($issueDialogDetails.get().excludedDependantIds).toEqual([dep1]);
            expect($issueDialogDetails.get().appliedExcludedDependantIds).toHaveLength(0);
            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(false);

            await applyDraftIssueDialogDetailsSelection();
            await flushPromises();

            expect(mockUpdateIssue).toHaveBeenCalledTimes(2);
            expect(mockShowFeedback).toHaveBeenCalledTimes(2);

            const { publishRequest } = mockUpdateIssue.mock.calls[1][0];
            expect(publishRequest.getExcludeChildrenIds().map((id: ContentId) => id.toString())).toEqual(['item-1']);
            expect(publishRequest.getExcludeIds().map((id: ContentId) => id.toString())).toEqual(['dep-1']);
            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(true);
        });

        it('should restore a hidden saved exclusion and preserve a staged edit after a child toggle', async () => {
            await openWithDependants();
            mockResolvePublishDependencies.mockImplementation(({ excludeChildrenIds = [] }) =>
                createResolveResult({ dependants: excludeChildrenIds.length > 0 ? [dep2] : [dep1, dep2] }),
            );

            setIssueDialogDetailsDependantIncluded(dep1, false);
            await applyDraftIssueDialogDetailsSelection();
            expect($issueDialogDetails.get().appliedExcludedDependantIds).toEqual([dep1]);

            await setIssueDialogDetailsItemIncludeChildren(item1, false);
            expect($issueDialogDetails.get().appliedExcludedDependantIds).toHaveLength(0);

            setIssueDialogDetailsDependantIncluded(dep2, false);
            await setIssueDialogDetailsItemIncludeChildren(item1, true);

            expect(mockUpdateIssue).toHaveBeenCalledTimes(3);
            const { publishRequest } = mockUpdateIssue.mock.calls[2][0];
            expect(publishRequest.getExcludeIds()).toEqual([dep1]);
            expect($issueDialogDetails.get().excludedDependantIds).toEqual([dep2, dep1]);
            expect($issueDialogDetails.get().appliedExcludedDependantIds).toEqual([dep1]);
            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(false);

            await applyDraftIssueDialogDetailsSelection();
            expect(mockUpdateIssue.mock.calls[3][0].publishRequest.getExcludeIds()).toEqual([dep2, dep1]);
            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(true);
        });

        it('should keep hidden saved exclusions when a visible dependant edit is applied', async () => {
            await openWithDependants();
            mockResolvePublishDependencies.mockImplementation(({ excludeChildrenIds = [] }) =>
                createResolveResult({ dependants: excludeChildrenIds.length > 0 ? [dep2] : [dep1, dep2] }),
            );

            setIssueDialogDetailsDependantIncluded(dep1, false);
            await applyDraftIssueDialogDetailsSelection();
            await setIssueDialogDetailsItemIncludeChildren(item1, false);
            expect($issueDialogDetails.get().appliedExcludedDependantIds).toHaveLength(0);

            setIssueDialogDetailsDependantIncluded(dep2, false);
            await applyDraftIssueDialogDetailsSelection();
            expect(mockUpdateIssue.mock.calls[2][0].publishRequest.getExcludeIds()).toEqual([dep2, dep1]);

            await setIssueDialogDetailsItemIncludeChildren(item1, true);
            expect(mockUpdateIssue.mock.calls[3][0].publishRequest.getExcludeIds()).toEqual([dep2, dep1]);
            expect($issueDialogDetails.get().appliedExcludedDependantIds).toEqual([dep2, dep1]);
        });

        it('should keep hidden saved exclusions when excluding an invalid dependant', async () => {
            await openWithDependants();
            mockResolvePublishDependencies.mockImplementation(({ excludeChildrenIds = [] }) =>
                createResolveResult({ dependants: excludeChildrenIds.length > 0 ? [dep2] : [dep1, dep2] }),
            );

            setIssueDialogDetailsDependantIncluded(dep1, false);
            await applyDraftIssueDialogDetailsSelection();
            await setIssueDialogDetailsItemIncludeChildren(item1, false);

            await updateIssueDialogExcludedDependants([dep2]);
            expect(mockUpdateIssue.mock.calls[2][0].publishRequest.getExcludeIds()).toEqual([dep2, dep1]);

            await setIssueDialogDetailsItemIncludeChildren(item1, true);
            expect(mockUpdateIssue.mock.calls[3][0].publishRequest.getExcludeIds()).toEqual([dep2, dep1]);
        });

        it('keeps a dependant edit staged after failed Apply and a queued reload', async () => {
            const issue = await openWithDependants();
            const save = createDeferredPromise<Result<Issue, Error>>();
            mockUpdateIssue.mockReturnValueOnce(save.promise);

            setIssueDialogDetailsDependantIncluded(dep1, false);
            const apply = applyDraftIssueDialogDetailsSelection();
            await loadIssueDialogItems(issue, { forceReload: true });

            save.resolve(err(new Error('save failed')));
            await apply;

            expect($issueDialogDetails.get().excludedDependantIds).toEqual([dep1]);
            expect($issueDialogDetails.get().appliedExcludedDependantIds).toHaveLength(0);
            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(false);
        });

        it('should roll back a failed children save without losing a staged dependant edit', async () => {
            await openWithDependants();
            mockUpdateIssue.mockReturnValue(errAsync({ message: 'boom' }));

            setIssueDialogDetailsDependantIncluded(dep1, false);
            await setIssueDialogDetailsItemIncludeChildren(item1, false);

            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(false);
            expect($issueDialogDetails.get().excludeChildrenIds).toHaveLength(0);
            expect($issueDialogDetails.get().appliedExcludeChildrenIds).toHaveLength(0);
            expect($issueDialogDetails.get().excludedDependantIds.map((id) => id.toString())).toEqual(['dep-1']);
            expect($issueDialogDetails.get().itemsUpdating).toBe(false);
            expect($issueDialogDetails.get().itemsLoading).toBe(false);
            expect(mockShowError).toHaveBeenCalled();
        });

        it('should cancel a staged dependant edit without undoing a saved children toggle', async () => {
            await openWithDependants();

            await setIssueDialogDetailsItemIncludeChildren(item1, false);
            setIssueDialogDetailsDependantIncluded(dep1, false);
            cancelDraftIssueDialogDetailsSelection();

            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(true);
            expect($issueDialogDetails.get().excludeChildrenIds.map((id) => id.toString())).toEqual(['item-1']);
            expect($issueDialogDetails.get().excludedDependantIds).toHaveLength(0);
            expect(mockUpdateIssue).toHaveBeenCalledTimes(1);
        });

        it('should keep a staged dependant edit through a background reload after a children toggle', async () => {
            await openWithDependants();

            await setIssueDialogDetailsItemIncludeChildren(item1, false);
            setIssueDialogDetailsDependantIncluded(dep1, false);
            mockResolvePublishDependencies.mockClear();

            emitContentUpdated([createMockContent('item-1')]);
            await flushPromises();

            const lastCall = mockResolvePublishDependencies.mock.calls.at(-1)?.[0];
            expect(lastCall.excludeChildrenIds).toEqual([item1]);
            expect($issueDialogDetails.get().excludeChildrenIds.map((id) => id.toString())).toEqual(['item-1']);
            expect($issueDialogDetails.get().excludedDependantIds.map((id) => id.toString())).toEqual(['dep-1']);
            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(false);
        });

        it('should drop a staged dependant edit when the issue changed on the server', async () => {
            await openWithDependants();

            await setIssueDialogDetailsItemIncludeChildren(item1, false);
            setIssueDialogDetailsDependantIncluded(dep1, false);

            // Someone else excluded a dependant meanwhile: the server selection wins.
            const changedIssue = createMockIssue('issue-1', [item1], {
                excludeChildrenIds: [item1],
                excludeIds: [dep2],
            });
            await loadIssueDialogItems(changedIssue);
            await flushPromises();

            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(true);
            expect($issueDialogDetails.get().excludeChildrenIds.map((id) => id.toString())).toEqual(['item-1']);
            expect($issueDialogDetails.get().excludedDependantIds.map((id) => id.toString())).toEqual(['dep-2']);
        });

        it('should keep a staged dependant edit when another item is removed', async () => {
            const item2 = new ContentId('item-2');
            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({ dependants: [dep1] }));
            mockFetchContentSummaries.mockImplementation((contentIds: ContentId[]) =>
                contentIds.map((id) => createMockContent(id.toString())),
            );

            const issue = createMockIssue('issue-1', [item1, item2]);
            await openListBackedIssueDetails(issue);
            await flushPromises();

            await setIssueDialogDetailsItemIncludeChildren(item1, false);
            setIssueDialogDetailsDependantIncluded(dep1, false);
            await updateIssueDialogItems([item1]);
            await flushPromises();

            expect($issueDialogDetails.get().excludeChildrenIds.map((id) => id.toString())).toEqual(['item-1']);
            expect($issueDialogDetails.get().excludedDependantIds.map((id) => id.toString())).toEqual(['dep-1']);
            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(false);
        });

        it('should auto-apply an error-bar exclusion while preserving another staged dependant edit', async () => {
            await openWithDependants();

            setIssueDialogDetailsDependantIncluded(dep2, false);
            await updateIssueDialogExcludedDependants([dep1]);
            await flushPromises();

            const { publishRequest } = mockUpdateIssue.mock.calls[0][0];
            expect(publishRequest.getExcludeIds().map((id: ContentId) => id.toString())).toEqual(['dep-1']);
            expect($issueDialogDetails.get().appliedExcludedDependantIds.map((id) => id.toString())).toEqual(['dep-1']);
            expect($issueDialogDetails.get().excludedDependantIds.map((id) => id.toString())).toEqual([
                'dep-2',
                'dep-1',
            ]);
            expect($isIssueDialogDetailsSelectionSynced.get()).toBe(false);
        });

        it('should keep the error and retry after a child save fails from an error state', async () => {
            const issue = await openWithDependants();

            mockResolvePublishDependencies.mockResolvedValue(err(new Error('resolve failed')));
            await loadIssueDialogItems(issue);
            expect($issueDialogDetails.get().itemsError).toBe(true);

            const resolveCalls = mockResolvePublishDependencies.mock.calls.length;
            mockUpdateIssue.mockReturnValueOnce(errAsync(new Error('save failed')));

            await setIssueDialogDetailsItemIncludeChildren(item1, false);

            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(resolveCalls + 1);
            expect($issueDialogDetails.get().appliedExcludeChildrenIds).toHaveLength(0);
            expect($issueDialogDetails.get().itemsUpdating).toBe(false);
            expect($issueDialogDetails.get().itemsLoading).toBe(false);
            expect($issueDialogDetails.get().itemsError).toBe(true);
        });

        it('should clear the applied selection on reset', async () => {
            await openWithDependants();
            await setIssueDialogDetailsItemIncludeChildren(item1, false);
            await flushPromises();

            resetIssueDialogDetails();

            expect($issueDialogDetails.get().appliedExcludeChildrenIds).toHaveLength(0);
            expect($issueDialogDetails.get().appliedExcludedDependantIds).toHaveLength(0);
        });
    });

    describe('excluded dependants visibility', () => {
        const item1 = new ContentId('item-1');
        const dep1 = new ContentId('dep-1');
        const dep2 = new ContentId('dep-2');

        async function excludeDep1AndApply(): Promise<void> {
            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({ dependants: [dep1, dep2] }));
            mockFetchContentSummaries.mockImplementation((contentIds: ContentId[]) =>
                contentIds.map((id) => createMockContent(id.toString())),
            );

            await openListBackedIssueDetails(createMockIssue('issue-1', [item1]));
            await flushPromises();

            setIssueDialogDetailsDependantIncluded(dep1, false);
            await applyDraftIssueDialogDetailsSelection();
            await flushPromises();
        }

        it('should offer nothing to hide until an exclusion is applied', async () => {
            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({ dependants: [dep1, dep2] }));
            mockFetchContentSummaries.mockImplementation((contentIds: ContentId[]) =>
                contentIds.map((id) => createMockContent(id.toString())),
            );

            await openListBackedIssueDetails(createMockIssue('issue-1', [item1]));
            await flushPromises();

            expect($issueDialogDetailsHasExcludedDependants.get()).toBe(false);

            setIssueDialogDetailsDependantIncluded(dep1, false);

            expect($issueDialogDetailsHasExcludedDependants.get()).toBe(false);

            await applyDraftIssueDialogDetailsSelection();
            await flushPromises();

            expect($issueDialogDetailsHasExcludedDependants.get()).toBe(true);
        });

        it('should flip the toggle and restore it on reset', async () => {
            await excludeDep1AndApply();
            expect($showIssueDialogDetailsExcludedDependants.get()).toBe(true);

            toggleIssueDialogDetailsShowExcludedDependants();
            expect($showIssueDialogDetailsExcludedDependants.get()).toBe(false);

            resetIssueDialogDetails();
            expect($showIssueDialogDetailsExcludedDependants.get()).toBe(true);
        });

        it('should count only the shown dependants while excluded ones are hidden', async () => {
            await excludeDep1AndApply();
            expect($issueDialogDetailsDependantsSelection.get().count).toBe(2);

            toggleIssueDialogDetailsShowExcludedDependants();

            const selection = $issueDialogDetailsDependantsSelection.get();
            expect(selection.count).toBe(1);
            expect(selection.selectionType).toBe('all');
            expect(selection.selectableIds.map((id) => id.toString())).toEqual(['dep-2']);
        });

        it('should keep a staged exclusion visible, hiding only the applied ones', async () => {
            await excludeDep1AndApply();
            toggleIssueDialogDetailsShowExcludedDependants();

            setIssueDialogDetailsDependantIncluded(dep2, false);

            const selection = $issueDialogDetailsDependantsSelection.get();
            expect(selection.count).toBe(1);
            expect(selection.selectionType).toBe('none');
        });

        it('should snap back to shown once the last exclusion is re-included', async () => {
            await excludeDep1AndApply();
            toggleIssueDialogDetailsShowExcludedDependants();
            expect($showIssueDialogDetailsExcludedDependants.get()).toBe(false);

            setIssueDialogDetailsDependantIncluded(dep1, true);
            await applyDraftIssueDialogDetailsSelection();
            await flushPromises();

            expect($issueDialogDetailsHasExcludedDependants.get()).toBe(false);
            expect($showIssueDialogDetailsExcludedDependants.get()).toBe(true);
        });
    });
});
