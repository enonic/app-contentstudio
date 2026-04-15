import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentId} from '../../../../app/content/ContentId';
import {
    emitContentArchived,
    emitContentCreated,
    emitContentDeleted,
    emitContentPublished,
    emitContentRenamed,
    emitContentUpdated,
} from '../socket.store';
import {
    $isRequestPublishReady,
    $requestPublishDialog,
    $requestPublishDialogErrors,
    openRequestPublishDialog,
    resetRequestPublishDialogContext,
    submitRequestPublishDialog,
} from './requestPublishDialog.store';
import {
    createDeferredPromise,
    createMockChangeItem,
    createMockContent,
    createResolveResult,
    flushDebouncedReload,
} from './dialog.store.test.utils';

const {
    mockCreateIssueSendAndParse,
    mockFetchContentSummaries,
    mockMarkAsReady,
    mockResolvePublishDependencies,
    mockShowError,
    mockShowFeedback,
    mockShowSuccess,
    mockShowWarning,
} = vi.hoisted(() => ({
    mockCreateIssueSendAndParse: vi.fn(),
    mockFetchContentSummaries: vi.fn(),
    mockMarkAsReady: vi.fn(),
    mockResolvePublishDependencies: vi.fn(),
    mockShowError: vi.fn(),
    mockShowFeedback: vi.fn(),
    mockShowSuccess: vi.fn(),
    mockShowWarning: vi.fn(),
}));

vi.mock('../../api/content', () => ({
    fetchContentSummaries: mockFetchContentSummaries,
}));

vi.mock('../../api/publish', () => ({
    markAsReady: mockMarkAsReady,
    resolvePublishDependencies: mockResolvePublishDependencies,
}));

vi.mock('../../../../app/issue/resource/CreateIssueRequest', () => ({
    CreateIssueRequest: class {
        setApprovers(): this {
            return this;
        }

        setPublishRequest(): this {
            return this;
        }

        setTitle(): this {
            return this;
        }

        setDescription(): this {
            return this;
        }

        setType(): this {
            return this;
        }

        sendAndParse(): Promise<never> {
            return mockCreateIssueSendAndParse();
        }
    },
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

const requestPublishMainItemEventCases = [
    {
        name: 'deleted',
        emit: (ids: string[]) => emitContentDeleted(ids.map(createMockChangeItem)),
    },
    {
        name: 'archived',
        emit: (ids: string[]) => emitContentArchived(ids.map(createMockChangeItem)),
    },
    {
        name: 'published',
        emit: (ids: string[]) => emitContentPublished(ids.map(id => createMockContent(id))),
    },
] as const;

async function flushRequestPublishReload(): Promise<void> {
    await flushDebouncedReload(200);
}

describe('requestPublishDialog.store', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetRequestPublishDialogContext();
        mockFetchContentSummaries.mockReset().mockResolvedValue([]);
        mockCreateIssueSendAndParse.mockReset();
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
        const original = createMockContent('item-1', {displayName: 'Original name'});
        const updated = createMockContent('item-1', {displayName: 'Updated name'});

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
        const original = createMockContent('item-1', {displayName: 'Original name'});
        const renamed = createMockContent('item-1', {displayName: 'Renamed item'});

        openRequestPublishDialog([original]);
        await flushRequestPublishReload();

        emitContentRenamed([renamed], []);

        expect($requestPublishDialog.get().items[0].getDisplayName()).toBe('Renamed item');
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
    });

    it('refreshes main items when created content is below a selected item path', async () => {
        const parent = createMockContent('item-1', {displayName: 'Parent', path: '/parent'});
        const updatedParent = createMockContent('item-1', {displayName: 'Parent', path: '/parent', hasChildren: true});
        const unrelated = createMockContent('item-2', {displayName: 'Elsewhere', path: '/other/child'});
        const child = createMockContent('item-3', {displayName: 'Child', path: '/parent/child'});

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some(id => id.toString() === 'item-1') ? [updatedParent] : [];
        });

        openRequestPublishDialog([parent]);
        await flushRequestPublishReload();

        emitContentCreated([unrelated]);
        await flushRequestPublishReload();

        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
        expect($requestPublishDialog.get().items[0].hasChildren()).toBe(false);

        emitContentCreated([child]);
        await flushRequestPublishReload();

        expect($requestPublishDialog.get().items[0].hasChildren()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });

    it.each(requestPublishMainItemEventCases)(
        'removes a non-last main item and reloads on $name events',
        async ({emit}) => {
            const first = createMockContent('item-1', {displayName: 'First'});
            const second = createMockContent('item-2', {displayName: 'Second'});

            openRequestPublishDialog([first, second]);
            await flushRequestPublishReload();

            emit(['item-1']);
            await flushRequestPublishReload();

            expect($requestPublishDialog.get().open).toBe(true);
            expect($requestPublishDialog.get().items.map(item => item.getId())).toEqual(['item-2']);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        },
    );

    it.each(requestPublishMainItemEventCases)(
        'closes the dialog when the last main item is removed by $name events',
        async ({emit}) => {
            const item = createMockContent('item-1', {displayName: 'Item'});

            openRequestPublishDialog([item]);
            await flushRequestPublishReload();

            emit(['item-1']);
            await flushRequestPublishReload();

            expect($requestPublishDialog.get().open).toBe(false);
            expect($requestPublishDialog.get().items).toEqual([]);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
        },
    );

    it('defers socket events during submit and reconciles them after a failed request', async () => {
        const item = createMockContent('item-1', {displayName: 'Item'});
        const submitRequestDeferred = createDeferredPromise<never>();

        openRequestPublishDialog([item]);
        await flushRequestPublishReload();

        mockCreateIssueSendAndParse.mockReturnValueOnce(submitRequestDeferred.promise);

        $requestPublishDialog.set({
            ...$requestPublishDialog.get(),
            title: 'Publish request',
            description: 'Keep this draft state intact',
            assigneeIds: ['user:system:editor'],
        });

        const submitPromise = submitRequestPublishDialog();
        await Promise.resolve();

        emitContentPublished([item]);

        expect($requestPublishDialog.get().open).toBe(true);
        expect($requestPublishDialog.get().items.map(currentItem => currentItem.getId())).toEqual(['item-1']);
        expect($requestPublishDialog.get().title).toBe('Publish request');
        expect($requestPublishDialog.get().description).toBe('Keep this draft state intact');
        expect($requestPublishDialog.get().assigneeIds).toEqual(['user:system:editor']);
        expect($requestPublishDialog.get().submitting).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);

        submitRequestDeferred.reject(new Error('Request failed'));
        await submitPromise;

        expect($requestPublishDialog.get().open).toBe(false);
        expect($requestPublishDialog.get().items).toEqual([]);
        expect($requestPublishDialog.get().title).toBe('');
        expect($requestPublishDialog.get().description).toBe('');
        expect($requestPublishDialog.get().assigneeIds).toEqual([]);
        expect($requestPublishDialog.get().submitting).toBe(false);
        expect(mockShowError).toHaveBeenCalledWith('Request failed');
    });

    it('reconciles queued non-removal events after a failed request', async () => {
        const item = createMockContent('item-1', {displayName: 'Original item'});
        const updatedItem = createMockContent('item-1', {displayName: 'Updated item'});
        const submitRequestDeferred = createDeferredPromise<never>();

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some(id => id.toString() === 'item-1') ? [updatedItem] : [];
        });

        openRequestPublishDialog([item]);
        await flushRequestPublishReload();

        mockCreateIssueSendAndParse.mockReturnValueOnce(submitRequestDeferred.promise);

        $requestPublishDialog.set({
            ...$requestPublishDialog.get(),
            title: 'Publish request',
            description: 'Keep this draft state intact',
            assigneeIds: ['user:system:editor'],
        });

        const submitPromise = submitRequestPublishDialog();
        await Promise.resolve();

        emitContentUpdated([updatedItem]);

        expect($requestPublishDialog.get().items[0].getDisplayName()).toBe('Original item');
        expect($requestPublishDialog.get().submitting).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);

        submitRequestDeferred.reject(new Error('Request failed'));
        await submitPromise;

        expect($requestPublishDialog.get().open).toBe(true);
        expect($requestPublishDialog.get().items[0].getDisplayName()).toBe('Updated item');
        expect($requestPublishDialog.get().title).toBe('Publish request');
        expect($requestPublishDialog.get().description).toBe('Keep this draft state intact');
        expect($requestPublishDialog.get().assigneeIds).toEqual(['user:system:editor']);
        expect($requestPublishDialog.get().submitting).toBe(false);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        expect(mockShowError).toHaveBeenCalledWith('Request failed');
    });
});
