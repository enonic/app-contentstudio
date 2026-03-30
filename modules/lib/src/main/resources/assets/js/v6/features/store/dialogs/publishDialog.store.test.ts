import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentId} from '../../../../app/content/ContentId';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {emitContentUpdated} from '../socket.store';
import {
    $isPublishReady,
    $publishCheckErrors,
    $publishDialog,
    openPublishDialog,
    resetPublishDialogContext,
} from './publishDialog.store';

const {
    mockFetchContentSummariesWithStatus,
    mockHasUnpublishedChildren,
    mockFindIdsByParents,
    mockMarkAsReady,
    mockPublishContent,
    mockResolvePublishDependencies,
    mockCleanupTask,
    mockTrackTask,
} = vi.hoisted(() => ({
    mockFetchContentSummariesWithStatus: vi.fn(),
    mockHasUnpublishedChildren: vi.fn(),
    mockFindIdsByParents: vi.fn(),
    mockMarkAsReady: vi.fn(),
    mockPublishContent: vi.fn(),
    mockResolvePublishDependencies: vi.fn(),
    mockCleanupTask: vi.fn(),
    mockTrackTask: vi.fn(),
}));

vi.mock('../../api/content', () => ({
    fetchContentSummariesWithStatus: mockFetchContentSummariesWithStatus,
}));

vi.mock('../../api/hasUnpublishedChildren', () => ({
    hasUnpublishedChildren: mockHasUnpublishedChildren,
}));

vi.mock('../../api/publish', () => ({
    findIdsByParents: mockFindIdsByParents,
    markAsReady: mockMarkAsReady,
    publishContent: mockPublishContent,
    resolvePublishDependencies: mockResolvePublishDependencies,
}));

vi.mock('../../services/task.service', () => ({
    cleanupTask: mockCleanupTask,
    trackTask: mockTrackTask,
}));

function createMockContent(id: string, displayName = `Content ${id}`): ContentSummaryAndCompareStatus {
    const contentId = new ContentId(id);

    return {
        getId: () => id,
        getContentId: () => contentId,
        getDisplayName: () => displayName,
        hasChildren: () => false,
        isOnline: () => false,
    } as ContentSummaryAndCompareStatus;
}

function createResolveResult({
    dependants = [],
    required = [],
    invalid = [],
    inProgress = [],
    notPublishable = [],
}: {
    dependants?: ContentId[];
    required?: ContentId[];
    invalid?: ContentId[];
    inProgress?: ContentId[];
    notPublishable?: ContentId[];
}) {
    return {
        getDependants: () => dependants,
        getRequired: () => required,
        getInvalid: () => invalid,
        getInProgress: () => inProgress,
        getNotPublishable: () => notPublishable,
    };
}

async function flushInitialReload(): Promise<void> {
    for (let i = 0; i < 10; i += 1) {
        await Promise.resolve();
    }
}

async function flushDebouncedReload(): Promise<void> {
    await vi.advanceTimersByTimeAsync(150);
}

describe('publishDialog.store', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetPublishDialogContext();
        mockFetchContentSummariesWithStatus.mockReset().mockResolvedValue([]);
        mockHasUnpublishedChildren.mockReset().mockResolvedValue(new Map());
        mockFindIdsByParents.mockReset().mockResolvedValue([]);
        mockMarkAsReady.mockReset();
        mockPublishContent.mockReset();
        mockResolvePublishDependencies.mockReset().mockResolvedValue(createResolveResult({}));
    });

    afterEach(() => {
        resetPublishDialogContext();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('reloads publish checks when a tracked main item is updated externally', async () => {
        const itemId = new ContentId('item-1');
        const original = createMockContent('item-1', 'Original name');
        const updated = createMockContent('item-1', 'Updated name');

        mockResolvePublishDependencies
            .mockResolvedValueOnce(createResolveResult({inProgress: [itemId]}))
            .mockResolvedValueOnce(createResolveResult({inProgress: [itemId]}))
            .mockResolvedValueOnce(createResolveResult({}))
            .mockResolvedValueOnce(createResolveResult({}));

        openPublishDialog([original]);
        await flushInitialReload();

        expect($publishCheckErrors.get().inProgress.count).toBe(1);
        expect($isPublishReady.get()).toBe(false);

        emitContentUpdated([updated]);

        expect($publishDialog.get().items[0].getDisplayName()).toBe('Updated name');

        await flushDebouncedReload();

        expect($publishCheckErrors.get().inProgress.count).toBe(0);
        expect($isPublishReady.get()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(4);
    });
});
