import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeServerChangeType } from '@enonic/lib-admin-ui/event/NodeServerChange';
import { ContentId } from '../../../../app/content/ContentId';
import type { IssueServerEvent } from '../../../../app/event/IssueServerEvent';
import type { Issue } from '../../../../app/issue/Issue';
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
import {
    $issueDialogDetails,
    $issueDialogDetailsDependantsSelection,
    $issueDialogDetailsHasMoreDependants,
    loadIssueDialogItems,
    loadMoreIssueDialogDependants,
} from './issueDialogDetails.store';
import {
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
    mockGetIssueSend,
    mockListIssueCommentsSend,
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
    mockGetIssueSend: vi.fn(),
    mockListIssueCommentsSend: vi.fn(),
}));

vi.mock('../../../entities/content/api/content.api', () => ({
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

vi.mock('../../../../app/issue/resource/GetIssueRequest', () => ({
    GetIssueRequest: class {
        constructor(private readonly id: string) {}

        sendAndParse(): Promise<unknown> {
            return mockGetIssueSend(this.id);
        }
    },
}));

vi.mock('../../../../app/issue/resource/ListIssueCommentsRequest', () => ({
    ListIssueCommentsRequest: class {
        constructor(private readonly id: string) {}

        sendAndParse(): Promise<unknown> {
            return mockListIssueCommentsSend(this.id);
        }
    },
}));

vi.mock('../../../../app/issue/resource/GetIssueStatsRequest', () => ({
    GetIssueStatsRequest: class {
        setRequestProject(): this {
            return this;
        }

        sendAndParse(): Promise<object> {
            return Promise.resolve({});
        }
    },
}));

vi.mock('../../../../app/issue/resource/ListIssuesRequest', () => ({
    ListIssuesRequest: class {
        setResolveAssignees(): this {
            return this;
        }

        setFrom(): this {
            return this;
        }

        setSize(): this {
            return this;
        }

        setRequestProject(): this {
            return this;
        }

        sendAndParse(): Promise<{ getIssues: () => []; getMetadata: () => { getTotalHits: () => number } }> {
            return Promise.resolve({
                getIssues: () => [],
                getMetadata: () => ({
                    getTotalHits: () => 0,
                }),
            });
        }
    },
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showError: mockShowError,
    showFeedback: mockShowFeedback,
}));

vi.mock('@enonic/lib-admin-ui/util/Messages', () => ({
    i18n: (key: string) => key,
}));

function createMockIssue(issueId: string, itemIds: ContentId[]): Issue {
    const publishRequest = {
        getItemsIds: () => itemIds,
        getExcludeChildrenIds: () => [],
        getExcludeIds: () => [],
    };

    return {
        getId: () => issueId,
        getType: () => IssueType.PUBLISH_REQUEST,
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
        vi.useFakeTimers();
        closeIssueDialog();
        mockFetchContentSummaries.mockReset().mockResolvedValue([]);
        mockResolvePublishDependencies.mockReset().mockResolvedValue(createResolveResult({}));
        mockShowError.mockReset();
        mockShowFeedback.mockReset();
        mockGetIssueSend.mockReset();
        mockListIssueCommentsSend.mockReset();
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
                getApprovers: () => [],
                getPublishRequest: () => null,
            } as unknown as Issue;

            mockGetIssueSend.mockResolvedValue(serverIssue);
            mockListIssueCommentsSend.mockResolvedValue({ getIssueComments: () => [{ getId: () => 'comment-1' }] });

            openIssueDialogDetails(issueId);
            await flushPromises();

            const unsubscribe = $issueDialogDetails.subscribe(() => {
                /* mount the store */
            });
            const notifyIssueChanged = captureIssueChangedListener();

            notifyIssueChanged([issueId], createServerEvent(NodeServerChangeType.UPDATE));
            await flushDebouncedReload(1250, 10);

            expect(mockGetIssueSend).toHaveBeenCalledWith(issueId);
            expect($issueDialogDetails.get().comments).toHaveLength(1);
            expect($issueDialogDetails.get().commentsIssueId).toBe(issueId);

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
            expect(mockGetIssueSend).not.toHaveBeenCalled();

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
});
