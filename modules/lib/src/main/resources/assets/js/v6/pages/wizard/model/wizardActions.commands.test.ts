import { atom } from 'nanostores';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentSummary } from '../../../../app/content/ContentSummary';

const mocks = vi.hoisted(() => ({
    openDeleteDialog: vi.fn(),
    openDuplicateDialog: vi.fn(),
    openMoveDialog: vi.fn(),
    openPublishDialog: vi.fn(),
    openUnpublishDialog: vi.fn(),
    notifyWarning: vi.fn(),
    handleError: vi.fn(),
    patchActivity: vi.fn(),
    createIssue: vi.fn(),
    requestPublish: vi.fn(),
    escalateVisibility: vi.fn(),
    openPublishRequest: vi.fn(),
}));

const stores = vi.hoisted(
    () =>
        ({}) as {
            $wizardActions: ReturnType<typeof atom<Record<string, { enabled: boolean; visible: boolean }>>>;
            $wizardContentState: ReturnType<typeof atom<string | null>>;
        },
);

vi.mock('../../../features/delete/model/deleteDialog.store', () => ({ openDeleteDialog: mocks.openDeleteDialog }));
vi.mock('../../../features/duplicate/model/duplicateDialog.store', () => ({
    openDuplicateDialog: mocks.openDuplicateDialog,
}));
vi.mock('../../../features/move/model/moveDialog.store', () => ({ openMoveDialog: mocks.openMoveDialog }));
vi.mock('../../../features/publish/model/publishDialog.commands', () => ({
    openPublishDialog: mocks.openPublishDialog,
}));
vi.mock('../../../features/unpublish/model/unpublishDialog.store', () => ({
    openUnpublishDialog: mocks.openUnpublishDialog,
}));
vi.mock('../../../shared/notifications', () => ({
    notifyWarning: mocks.notifyWarning,
    handleError: mocks.handleError,
}));
vi.mock('../../../shared/i18n', () => ({ i18n: (key: string) => key }));
vi.mock('../../../../app/browse/CreateIssuePromptEvent', () => ({
    CreateIssuePromptEvent: class {
        fire = mocks.createIssue;
    },
}));
vi.mock('../../../../app/browse/RequestContentPublishPromptEvent', () => ({
    RequestContentPublishPromptEvent: class {
        fire = mocks.requestPublish;
    },
}));
vi.mock('../../../../app/content/ContentSummaryAndCompareStatus', () => ({
    ContentSummaryAndCompareStatus: { fromContentSummary: (content: unknown) => content },
}));

vi.mock('./wizardActions.store', async () => {
    const { atom: createAtom } = await import('nanostores');
    stores.$wizardActions = createAtom({});

    return { $wizardActions: stores.$wizardActions, patchWizardActionActivity: mocks.patchActivity };
});

vi.mock('./wizardContent.store', async () => {
    const { atom: createAtom } = await import('nanostores');
    stores.$wizardContentState = createAtom<string | null>('ready');

    return { $wizardContentState: stores.$wizardContentState };
});

vi.mock('./wizardValidation.store', () => ({ escalateVisibility: mocks.escalateVisibility }));
vi.mock('./wizardPublishRequest.service', () => ({ openWizardPublishRequest: mocks.openPublishRequest }));

import { executeWizardAction, mustSaveBeforeWizardAction, saveWizardContent } from './wizardActions.commands';
import { registerWizardController, type WizardController } from './wizardController';

const CONTENT = { id: 'content' } as unknown as ContentSummary;

const ALL_IDS = [
    'save',
    'saveAndClose',
    'archive',
    'duplicate',
    'move',
    'publish',
    'publishTree',
    'unpublish',
    'markAsReady',
    'requestPublish',
    'openRequest',
    'createIssue',
    'reset',
    'localize',
];

const enableAll = (enabled = true): void => {
    stores.$wizardActions.set(Object.fromEntries(ALL_IDS.map((id) => [id, { enabled, visible: true }])));
};

const createController = (overrides: Partial<WizardController> = {}): WizardController => ({
    getPersistedContent: () => CONTENT,
    hasUnsavedChanges: () => false,
    save: vi.fn(() => Promise.resolve(CONTENT)),
    close: vi.fn(),
    isMarkedAsReady: () => false,
    setMarkedAsReady: vi.fn(),
    executeLegacy: vi.fn(),
    ...overrides,
});

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('wizardActions.commands', () => {
    let unregister: () => void = () => undefined;

    const register = (overrides: Partial<WizardController> = {}): WizardController => {
        const controller = createController(overrides);
        unregister();
        unregister = registerWizardController(controller);
        return controller;
    };

    beforeEach(() => {
        Object.values(mocks).forEach((mock) => mock.mockReset());
        stores.$wizardContentState.set('ready');
        enableAll();
        unregister();
        unregister = () => undefined;
    });

    it('should do nothing without a wizard or for a disabled action', () => {
        executeWizardAction('archive');

        register();
        enableAll(false);
        executeWizardAction('archive');

        expect(mocks.openDeleteDialog).not.toHaveBeenCalled();
    });

    it('should open the dialogs of archive, duplicate and move for the persisted content', () => {
        register();

        executeWizardAction('archive');
        executeWizardAction('duplicate');
        executeWizardAction('move');

        expect(mocks.openDeleteDialog).toHaveBeenCalledWith([CONTENT]);
        expect(mocks.openDuplicateDialog).toHaveBeenCalledWith([CONTENT]);
        expect(mocks.openMoveDialog).toHaveBeenCalledWith([CONTENT]);
    });

    it('should hand reset and localize to the legacy wizard', () => {
        const controller = register();

        executeWizardAction('reset');
        executeWizardAction('localize');

        expect(controller.executeLegacy).toHaveBeenCalledTimes(2);
        expect(controller.executeLegacy).toHaveBeenLastCalledWith('localize');
    });

    it('should open the publish request the content is in', () => {
        register();

        executeWizardAction('openRequest');

        expect(mocks.openPublishRequest).toHaveBeenCalledTimes(1);
    });

    describe('publish', () => {
        it('should open the dialog at once when there is nothing to save', () => {
            const controller = register();

            executeWizardAction('publish');
            executeWizardAction('publishTree');

            expect(controller.save).not.toHaveBeenCalled();
            expect(mocks.openPublishDialog).toHaveBeenNthCalledWith(1, [CONTENT]);
            expect(mocks.openPublishDialog).toHaveBeenNthCalledWith(2, [CONTENT], true);
        });

        it('should save first when there are unsaved changes, holding the action meanwhile', async () => {
            const controller = register({ hasUnsavedChanges: () => true });

            executeWizardAction('publish');

            expect(mocks.patchActivity).toHaveBeenCalledWith({ busy: 'publish' });
            expect(mocks.openPublishDialog).not.toHaveBeenCalled();

            await flush();

            expect(controller.save).toHaveBeenCalledTimes(1);
            expect(mocks.openPublishDialog).toHaveBeenCalledWith([CONTENT]);
            expect(mocks.patchActivity).toHaveBeenLastCalledWith({ busy: undefined });
        });

        it('should not open the dialog when the save produced nothing or failed', async () => {
            register({ hasUnsavedChanges: () => true, save: () => Promise.resolve(undefined) });
            executeWizardAction('publish');
            await flush();

            register({ hasUnsavedChanges: () => true, save: () => Promise.reject(new Error('failed')) });
            executeWizardAction('publish');
            await flush();

            expect(mocks.openPublishDialog).not.toHaveBeenCalled();
            expect(mocks.handleError).toHaveBeenCalledTimes(1);
            expect(mocks.patchActivity).toHaveBeenLastCalledWith({ busy: undefined });
        });

        it('should show every validation message when publishing with unsaved changes', () => {
            register();
            executeWizardAction('publish');
            expect(mocks.escalateVisibility).not.toHaveBeenCalled();

            register({ hasUnsavedChanges: () => true });
            executeWizardAction('publish');
            executeWizardAction('requestPublish');

            expect(mocks.escalateVisibility).toHaveBeenCalledTimes(1);
            expect(mocks.escalateVisibility).toHaveBeenCalledWith('all');
        });

        it('should warn instead of publishing invalid content', () => {
            const controller = register({ hasUnsavedChanges: () => true });
            stores.$wizardContentState.set('invalid');

            executeWizardAction('publish');
            executeWizardAction('publishTree');
            executeWizardAction('markAsReady');

            expect(mocks.notifyWarning).toHaveBeenCalledTimes(3);
            expect(controller.save).not.toHaveBeenCalled();
        });

        it('should keep request publish silent for invalid content', () => {
            register();
            stores.$wizardContentState.set('invalid');

            executeWizardAction('requestPublish');

            expect(mocks.notifyWarning).not.toHaveBeenCalled();
            expect(mocks.requestPublish).not.toHaveBeenCalled();
        });

        it('should unpublish and create an issue for invalid content too', () => {
            register();
            stores.$wizardContentState.set('invalid');

            executeWizardAction('unpublish');
            executeWizardAction('createIssue');

            expect(mocks.openUnpublishDialog).toHaveBeenCalledWith([CONTENT]);
            expect(mocks.createIssue).toHaveBeenCalledTimes(1);
        });

        it('should mark as ready by saving, even without unsaved changes', async () => {
            const controller = register();

            executeWizardAction('markAsReady');
            await flush();

            expect(controller.setMarkedAsReady).toHaveBeenCalledWith(true);
            expect(controller.save).toHaveBeenCalledTimes(1);
            expect(mocks.openPublishDialog).toHaveBeenCalledWith([CONTENT]);
        });

        it('should not publish after mark as ready when the saved content is invalid', async () => {
            register({
                save: () => {
                    stores.$wizardContentState.set('invalid');
                    return Promise.resolve(CONTENT);
                },
            });

            executeWizardAction('markAsReady');
            await flush();

            expect(mocks.openPublishDialog).not.toHaveBeenCalled();
        });

        it('should say whether an action saves first', () => {
            register();
            expect(mustSaveBeforeWizardAction('publish')).toBe(false);
            expect(mustSaveBeforeWizardAction('markAsReady')).toBe(true);

            register({ isMarkedAsReady: () => true });
            expect(mustSaveBeforeWizardAction('markAsReady')).toBe(false);

            register({ hasUnsavedChanges: () => true });
            expect(mustSaveBeforeWizardAction('publish')).toBe(true);
        });
    });

    describe('save', () => {
        it('should report saving, then saved', async () => {
            const controller = register();

            executeWizardAction('save');
            expect(mocks.patchActivity).toHaveBeenCalledWith({ saving: true });

            await flush();

            expect(controller.save).toHaveBeenCalledTimes(1);
            expect(mocks.patchActivity).toHaveBeenLastCalledWith({ saving: false, saved: true });
        });

        it('should clear the saved state and report the error when the save fails', async () => {
            register({ save: () => Promise.reject(new Error('failed')) });

            await saveWizardContent();

            expect(mocks.patchActivity).toHaveBeenLastCalledWith({ saving: false, saved: false });
            expect(mocks.handleError).toHaveBeenCalledTimes(1);
        });

        it('should save regardless of the Save button when asked directly', async () => {
            const controller = register();
            enableAll(false);

            await saveWizardContent();

            expect(controller.save).toHaveBeenCalledTimes(1);
        });

        it('should close after Save and close has saved', async () => {
            const controller = register();

            executeWizardAction('saveAndClose');
            expect(controller.close).not.toHaveBeenCalled();

            await flush();

            expect(controller.close).toHaveBeenCalledTimes(1);
        });
    });
});
