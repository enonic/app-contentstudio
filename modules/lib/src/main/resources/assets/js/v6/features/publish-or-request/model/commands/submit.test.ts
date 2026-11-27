import { errAsync, okAsync } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { $publishOrRequestFields, INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE } from '../publishOrRequestFields.store';
import { closePublishOrRequestDialog } from './open';
import { publishPublishOrRequestItemsNow, submitPublishOrRequestDialog } from './submit';

const mocks = vi.hoisted(() => ({
    mockLoad: vi.fn(),
    mockCancelLoad: vi.fn(),
    mockPublishContent: vi.fn(),
    mockTrackTask: vi.fn(),
    mockCleanupTask: vi.fn(),
    mockNotifySuccess: vi.fn(),
    mockNotifyError: vi.fn(),
    mockCanRequestPublish: vi.fn(),
}));
const { mockLoad, mockCancelLoad, mockPublishContent, mockTrackTask, mockCleanupTask } = mocks;
const { mockNotifySuccess, mockNotifyError, mockCanRequestPublish } = mocks;

vi.mock('./load', () => ({
    loadPublishOrRequestDialogData: mocks.mockLoad,
    cancelPublishOrRequestDialogLoad: mocks.mockCancelLoad,
}));

vi.mock('../../../../entities/content/api/publish.api', () => ({ publishContent: mocks.mockPublishContent }));

vi.mock('../../../../entities/task', () => ({ trackTask: mocks.mockTrackTask, cleanupTask: mocks.mockCleanupTask }));

vi.mock('../../../../shared/notifications', () => ({
    notifySuccess: mocks.mockNotifySuccess,
    notifyError: mocks.mockNotifyError,
}));

vi.mock('../../../../shared/i18n', () => ({
    i18n: (key: string, ...args: unknown[]) => [key, ...args].join(' '),
}));

vi.mock('../../../../../app/settings/data/project/ProjectHelper', () => ({
    ProjectHelper: { canRequestPublish: mocks.mockCanRequestPublish },
}));

const FROM = new Date('2030-01-01T08:00:00Z');
const TO = new Date('2030-02-01T08:00:00Z');

const createItem = (id: string, name: string): ContentSummary =>
    ({ getContentId: () => new ContentId(id), getDisplayName: () => name }) as unknown as ContentSummary;

const toIds = (...ids: string[]): ContentId[] => ids.map((id) => new ContentId(id));

// A main item and two dependencies, one of them unticked and applied; all with something to
// publish, and nothing in the way.
const setReady = (): void => {
    $publishOrRequestDialog.set({
        ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
        open: true,
        step: 'publishing',
        items: [createItem('main', 'Main')],
        excludeChildrenIds: toIds('main'),
        dependantIds: toIds('d0', 'd1'),
        excludedDependantIds: toIds('d1'),
        appliedExcludedDependantIds: toIds('d1'),
        publishableIds: toIds('main', 'd0', 'd1'),
        schedulable: true,
    });
};

const setFields = (patch: Partial<typeof INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE>): void => {
    $publishOrRequestFields.set({ ...INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE, ...patch });
};

// Ends the task the way the server would, with the callback the command handed to the tracker.
const completeTask = (state: 'SUCCESS' | 'ERROR', text = ''): void => {
    const [, config] = mockTrackTask.mock.calls[0];
    config.onComplete(state, text);
};

describe('publish or request dialog submit commands', () => {
    beforeEach(() => {
        Object.values(mocks).forEach((mock) => mock.mockReset());
        mockCanRequestPublish.mockReturnValue(true);
        mockPublishContent.mockReturnValue(okAsync('task-1'));
        setFields({});
        setReady();
    });

    afterEach(() => {
        closePublishOrRequestDialog();
        vi.restoreAllMocks();
    });

    describe('submitPublishOrRequestDialog', () => {
        describe('to publish', () => {
            it('should publish the items with the applied selection', async () => {
                await submitPublishOrRequestDialog();

                const [params] = mockPublishContent.mock.calls[0];
                expect(params.ids.map(String)).toEqual(['main']);
                expect(params.excludedIds.map(String)).toEqual(['d1']);
                expect(params.excludeChildrenIds.map(String)).toEqual(['main']);
            });

            it('should send no message and no schedule while nothing is entered', async () => {
                await submitPublishOrRequestDialog();

                const [params] = mockPublishContent.mock.calls[0];
                expect(params.message).toBeUndefined();
                expect(params.schedule).toBeUndefined();
            });

            it('should send the comment as the message, trimmed', async () => {
                setFields({ comment: ' Spring campaign\n' });

                await submitPublishOrRequestDialog();

                expect(mockPublishContent.mock.calls[0][0].message).toBe('Spring campaign');
            });

            it('should send no message for a blank comment', async () => {
                setFields({ comment: '   ' });

                await submitPublishOrRequestDialog();

                expect(mockPublishContent.mock.calls[0][0].message).toBeUndefined();
            });

            it('should not send dates that were entered and then unticked', async () => {
                setFields({ scheduleChecked: false, scheduleFrom: FROM, scheduleTo: TO });

                await submitPublishOrRequestDialog();

                expect(mockPublishContent.mock.calls[0][0].schedule).toBeUndefined();
            });

            it('should be submitting a publish until the server answers, then know the task', async () => {
                const submit = submitPublishOrRequestDialog();

                expect($publishOrRequestDialog.get().submitting).toBe('publish');
                expect($publishOrRequestDialog.get().taskId).toBeUndefined();

                await submit;

                expect($publishOrRequestDialog.get().submitting).toBe('publish');
                expect($publishOrRequestDialog.get().taskId).toBe('task-1');
            });

            it('should drop a load that waits, and track the task', async () => {
                await submitPublishOrRequestDialog();

                expect(mockCancelLoad).toHaveBeenCalledOnce();
                expect(mockTrackTask).toHaveBeenCalledExactlyOnceWith('task-1', expect.anything());
            });

            it('should tell how many items were published and close, once the task succeeds', async () => {
                await submitPublishOrRequestDialog();

                completeTask('SUCCESS');

                expect(mockNotifySuccess).toHaveBeenCalledExactlyOnceWith('dialog.publish.success.multiple 2');
                expect(mockCleanupTask).toHaveBeenCalledExactlyOnceWith('task-1');
                expect($publishOrRequestDialog.get()).toEqual(INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE);
            });

            it('should name the item when it is the only one published', async () => {
                $publishOrRequestDialog.setKey('publishableIds', toIds('main'));

                await submitPublishOrRequestDialog();
                completeTask('SUCCESS');

                expect(mockNotifySuccess).toHaveBeenCalledExactlyOnceWith('dialog.publish.success.single Main');
            });

            it('should tell what the task says and close, once the task fails', async () => {
                await submitPublishOrRequestDialog();

                completeTask('ERROR', 'Could not publish');

                expect(mockNotifyError).toHaveBeenCalledExactlyOnceWith('Could not publish');
                expect(mockNotifySuccess).not.toHaveBeenCalled();
                expect($publishOrRequestDialog.get().open).toBe(false);
            });

            it('should leave another dialog alone when the task of a closed one ends', async () => {
                await submitPublishOrRequestDialog();
                closePublishOrRequestDialog();
                setReady();

                completeTask('SUCCESS');

                expect($publishOrRequestDialog.get().open).toBe(true);
            });
        });

        describe('to schedule', () => {
            beforeEach(() => {
                setFields({ scheduleChecked: true, scheduleFrom: FROM, scheduleTo: TO, comment: 'Later' });
            });

            it('should send the dates and the comment', async () => {
                await submitPublishOrRequestDialog();

                const [params] = mockPublishContent.mock.calls[0];
                expect(params.schedule).toEqual({ from: FROM, to: TO });
                expect(params.message).toBe('Later');
            });

            it('should leave "online from" out when it is empty', async () => {
                setFields({ scheduleChecked: true, scheduleTo: TO, comment: 'Later' });

                await submitPublishOrRequestDialog();

                expect(mockPublishContent.mock.calls[0][0].schedule).toEqual({ from: undefined, to: TO });
            });

            it('should tell how many items were scheduled, once the task succeeds', async () => {
                await submitPublishOrRequestDialog();

                completeTask('SUCCESS');

                expect(mockNotifySuccess).toHaveBeenCalledExactlyOnceWith(
                    'dialog.publishOrRequest.scheduled.multiple 2',
                );
            });

            it('should name the item when it is the only one scheduled', async () => {
                $publishOrRequestDialog.setKey('publishableIds', toIds('main'));

                await submitPublishOrRequestDialog();
                completeTask('SUCCESS');

                expect(mockNotifySuccess).toHaveBeenCalledExactlyOnceWith(
                    'dialog.publishOrRequest.scheduled.single Main',
                );
            });
        });

        describe('when the server refuses the publish', () => {
            beforeEach(() => {
                mockPublishContent.mockReturnValue(errAsync(new Error('Refused')));
            });

            it('should tell, and bring the dialog back as it was', async () => {
                setFields({ comment: 'Spring campaign' });

                await submitPublishOrRequestDialog();

                expect(mockNotifyError).toHaveBeenCalledExactlyOnceWith('dialog.publish.publishing.error');
                expect($publishOrRequestDialog.get()).toMatchObject({ open: true, step: 'publishing' });
                expect($publishOrRequestDialog.get().submitting).toBeUndefined();
                expect($publishOrRequestFields.get().comment).toBe('Spring campaign');
            });

            it('should load again, and track nothing', async () => {
                await submitPublishOrRequestDialog();

                expect(mockLoad).toHaveBeenCalledOnce();
                expect(mockTrackTask).not.toHaveBeenCalled();
            });
        });

        describe('when it cannot be submitted', () => {
            it.each([
                { name: 'the dependencies load', patch: { loading: true } },
                { name: 'an item is in progress', patch: { inProgressIds: toIds('main') } },
                { name: 'it is being submitted already', patch: { submitting: 'publish' as const } },
            ])('should do nothing while $name', async ({ patch }) => {
                $publishOrRequestDialog.set({ ...$publishOrRequestDialog.get(), ...patch });

                await submitPublishOrRequestDialog();

                expect(mockPublishContent).not.toHaveBeenCalled();
            });

            it('should do nothing while a field that is asked for is empty', async () => {
                setFields({ scheduleChecked: true });

                await submitPublishOrRequestDialog();

                expect(mockPublishContent).not.toHaveBeenCalled();
            });
        });

        it('should not publish what is to be requested', async () => {
            setFields({ assignChecked: true, assigneeIds: ['user:system:a'], title: 'Title', comment: 'Comment' });

            await submitPublishOrRequestDialog();

            expect(mockPublishContent).not.toHaveBeenCalled();
            expect($publishOrRequestDialog.get().submitting).toBeUndefined();
        });
    });

    describe('publishPublishOrRequestItemsNow', () => {
        beforeEach(() => {
            $publishOrRequestDialog.setKey('step', 'items');
        });

        it('should publish the items with the applied selection', async () => {
            await publishPublishOrRequestItemsNow();

            const [params] = mockPublishContent.mock.calls[0];
            expect(params.ids.map(String)).toEqual(['main']);
            expect(params.excludedIds.map(String)).toEqual(['d1']);
            expect(params.excludeChildrenIds.map(String)).toEqual(['main']);
        });

        it('should send no message and no schedule, whatever the second step holds', async () => {
            setFields({ scheduleChecked: true, scheduleFrom: FROM, scheduleTo: TO, comment: 'Later' });

            await publishPublishOrRequestItemsNow();

            const [params] = mockPublishContent.mock.calls[0];
            expect(params.message).toBeUndefined();
            expect(params.schedule).toBeUndefined();
        });

        it('should publish even while the second step is not filled', async () => {
            setFields({ assignChecked: true });

            await publishPublishOrRequestItemsNow();

            expect(mockPublishContent).toHaveBeenCalledOnce();
        });

        it('should show the progress, tell that the items were published and close', async () => {
            setFields({ scheduleChecked: true, scheduleFrom: FROM, comment: 'Later' });

            await publishPublishOrRequestItemsNow();
            expect($publishOrRequestDialog.get()).toMatchObject({ submitting: 'publish', taskId: 'task-1' });

            completeTask('SUCCESS');

            expect(mockNotifySuccess).toHaveBeenCalledExactlyOnceWith('dialog.publish.success.multiple 2');
            expect($publishOrRequestDialog.get().open).toBe(false);
        });

        it('should tell, and bring the dialog back on its first step, when the server refuses', async () => {
            mockPublishContent.mockReturnValue(errAsync(new Error('Refused')));

            await publishPublishOrRequestItemsNow();

            expect(mockNotifyError).toHaveBeenCalledExactlyOnceWith('dialog.publish.publishing.error');
            expect($publishOrRequestDialog.get()).toMatchObject({ open: true, step: 'items' });
            expect($publishOrRequestDialog.get().submitting).toBeUndefined();
            expect(mockLoad).toHaveBeenCalledOnce();
        });

        it.each([
            { name: 'the dependencies load', patch: { loading: true } },
            { name: 'an item is in progress', patch: { inProgressIds: toIds('main') } },
            { name: 'a dependency cannot be published by the user', patch: { notPublishableIds: toIds('d0') } },
            { name: 'it is being submitted already', patch: { submitting: 'publish' as const } },
        ])('should do nothing while $name', async ({ patch }) => {
            $publishOrRequestDialog.set({ ...$publishOrRequestDialog.get(), ...patch });

            await publishPublishOrRequestItemsNow();

            expect(mockPublishContent).not.toHaveBeenCalled();
        });
    });
});
