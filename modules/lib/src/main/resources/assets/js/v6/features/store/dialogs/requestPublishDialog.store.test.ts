import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentId} from '../../../../app/content/ContentId';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {emitContentRenamed, emitContentUpdated} from '../socket.store';
import {
    $isRequestPublishReady,
    $requestPublishDialog,
    $requestPublishDialogErrors,
    openRequestPublishDialog,
    resetRequestPublishDialogContext,
} from './requestPublishDialog.store';

const {
    mockFetchContentSummariesWithStatus,
    mockMarkAsReady,
    mockResolvePublishDependencies,
    mockShowError,
    mockShowFeedback,
    mockShowSuccess,
    mockShowWarning,
} = vi.hoisted(() => ({
    mockFetchContentSummariesWithStatus: vi.fn(),
    mockMarkAsReady: vi.fn(),
    mockResolvePublishDependencies: vi.fn(),
    mockShowError: vi.fn(),
    mockShowFeedback: vi.fn(),
    mockShowSuccess: vi.fn(),
    mockShowWarning: vi.fn(),
}));

vi.mock('../../api/content', () => ({
    fetchContentSummariesWithStatus: mockFetchContentSummariesWithStatus,
}));

vi.mock('../../api/publish', () => ({
    markAsReady: mockMarkAsReady,
    resolvePublishDependencies: mockResolvePublishDependencies,
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showError: mockShowError,
    showFeedback: mockShowFeedback,
    showSuccess: mockShowSuccess,
    showWarning: mockShowWarning,
}));

vi.mock('@enonic/lib-admin-ui/util/Messages', () => ({
    i18n: (key: string) => key,
}));

function createMockContent(id: string, displayName = `Content ${id}`): ContentSummaryAndCompareStatus {
    const contentId = new ContentId(id);

    return {
        getId: () => id,
        getContentId: () => contentId,
        getDisplayName: () => displayName,
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

async function flushRequestPublishReload(): Promise<void> {
    await vi.advanceTimersByTimeAsync(200);
}

describe('requestPublishDialog.store', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetRequestPublishDialogContext();
        mockFetchContentSummariesWithStatus.mockReset().mockResolvedValue([]);
        mockMarkAsReady.mockReset();
        mockResolvePublishDependencies.mockReset().mockResolvedValue(createResolveResult({}));
        mockShowError.mockReset();
        mockShowFeedback.mockReset();
        mockShowSuccess.mockReset();
        mockShowWarning.mockReset();
    });

    afterEach(() => {
        resetRequestPublishDialogContext();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('patches updated main items and refreshes ready-state checks after external updates', async () => {
        const itemId = new ContentId('item-1');
        const original = createMockContent('item-1', 'Original name');
        const updated = createMockContent('item-1', 'Updated name');

        mockResolvePublishDependencies
            .mockResolvedValueOnce(createResolveResult({inProgress: [itemId]}))
            .mockResolvedValueOnce(createResolveResult({}));

        openRequestPublishDialog([original]);
        await flushRequestPublishReload();

        expect($requestPublishDialogErrors.get().inProgress.count).toBe(1);
        expect($isRequestPublishReady.get()).toBe(false);

        emitContentUpdated([updated]);

        expect($requestPublishDialog.get().items[0].getDisplayName()).toBe('Updated name');

        await flushRequestPublishReload();

        expect($requestPublishDialogErrors.get().inProgress.count).toBe(0);
        expect($isRequestPublishReady.get()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });

    it('patches renamed items without forcing a dependency reload', async () => {
        const original = createMockContent('item-1', 'Original name');
        const renamed = createMockContent('item-1', 'Renamed item');

        openRequestPublishDialog([original]);
        await flushRequestPublishReload();

        emitContentRenamed([renamed], []);

        expect($requestPublishDialog.get().items[0].getDisplayName()).toBe('Renamed item');
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
    });
});
