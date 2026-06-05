import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentId} from '../../../../app/content/ContentId';
import type {Issue} from '../../../../app/issue/Issue';
import {IssueType} from '../../../../app/issue/IssueType';
import type {IssueWithAssignees} from '../../../../app/issue/IssueWithAssignees';
import {
    emitContentArchived,
    emitContentCreated,
    emitContentDeleted,
    emitContentPublished,
    emitContentUpdated,
} from '../socket.store';
import {$issueDialog, closeIssueDialog, openIssueDialogDetails} from './issueDialog.store';
import {$issueDialogDetails, loadIssueDialogItems} from './issueDialogDetails.store';
import {
    createMockChangeItem,
    createMockContent,
    createResolveResult,
    flushPromises,
} from './dialog.store.test.utils';

const {
    mockFetchContentSummaries,
    mockResolvePublishDependencies,
    mockShowError,
    mockShowFeedback,
    mockIssueServerEventsHandler,
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
}));

vi.mock('../../api/content', () => ({
    fetchContentSummaries: mockFetchContentSummaries,
}));

vi.mock('../../api/publish', () => ({
    resolvePublishDependencies: mockResolvePublishDependencies,
}));

vi.mock('../../../../app/issue/event/IssueServerEventsHandler', () => ({
    IssueServerEventsHandler: {
        getInstance: () => mockIssueServerEventsHandler,
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

        sendAndParse(): Promise<{getIssues: () => []; getMetadata: () => {getTotalHits: () => number}}> {
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
    });

    afterEach(() => {
        closeIssueDialog();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('reloads items for list-backed issue details on tracked content updates', async () => {
        const itemId = new ContentId('item-1');
        const issue = createMockIssue('issue-1', [itemId]);
        const original = createMockContent('item-1', {displayName: 'Original'});
        const updated = createMockContent('item-1', {displayName: 'Updated'});
        let fetchedItems = [original];

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some(id => id.toString() === 'item-1') ? fetchedItems : [];
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
        const parent = createMockContent('item-1', {displayName: 'Parent', path: '/parent'});
        const updatedParent = createMockContent('item-1', {
            displayName: 'Parent',
            path: '/parent',
            hasChildren: true,
        });
        const unrelated = createMockContent('item-2', {displayName: 'Elsewhere', path: '/other/child'});
        const child = createMockContent('item-3', {displayName: 'Child', path: '/parent/child'});
        let fetchedItems = [parent];

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some(id => id.toString() === 'item-1') ? fetchedItems : [];
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

    it.each(removalEventCases)(
        'removes and reloads list-backed issue details on $name events',
        async ({emit}) => {
            const itemId = new ContentId('item-1');
            const issue = createMockIssue('issue-1', [itemId]);
            const original = createMockContent('item-1', {displayName: 'Original'});
            let fetchedItems = [original];

            mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
                return ids.some(id => id.toString() === 'item-1') ? fetchedItems : [];
            });

            await openListBackedIssueDetails(issue);

            fetchedItems = [];
            emit('item-1');
            await flushPromises();

            expect($issueDialogDetails.get().items).toEqual([]);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        },
    );

    it('patches and reloads list-backed issue details on published events', async () => {
        const itemId = new ContentId('item-1');
        const issue = createMockIssue('issue-1', [itemId]);
        const original = createMockContent('item-1', {displayName: 'Original'});
        const published = createMockContent('item-1', {displayName: 'Published', isOnline: true});
        let fetchedItems = [original];

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some(id => id.toString() === 'item-1') ? fetchedItems : [];
        });

        await openListBackedIssueDetails(issue);

        fetchedItems = [published];
        emitContentPublished([published]);
        await flushPromises();

        expect($issueDialogDetails.get().items[0].getDisplayName()).toBe('Published');
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });
});
