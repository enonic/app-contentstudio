import { CreateIssuePromptEvent } from '../../../../app/browse/CreateIssuePromptEvent';
import { RequestContentPublishPromptEvent } from '../../../../app/browse/RequestContentPublishPromptEvent';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';
import { openDeleteDialog } from '../../../features/delete/model/deleteDialog.store';
import { openDuplicateDialog } from '../../../features/duplicate/model/duplicateDialog.store';
import { openMoveDialog } from '../../../features/move/model/moveDialog.store';
import { openPublishDialog } from '../../../features/publish/model/publishDialog.commands';
import { openUnpublishDialog } from '../../../features/unpublish/model/unpublishDialog.store';
import { i18n } from '../../../shared/i18n';
import { handleError, notifyWarning } from '../../../shared/notifications';
import { $wizardActions, patchWizardActionActivity, type WizardActionId } from './wizardActions.store';
import { $wizardContentState, $wizardIsMarkedAsReady, setWizardMarkedAsReady } from './wizardContent.store';
import { escalateVisibility } from './wizardValidation.store';
import { getWizardController, type WizardController, type WizardSaveOptions } from './wizardController';
import { localizeWizardContent, resetWizardInheritance } from './wizardInheritance.commands';
import { openWizardPublishRequest } from './wizardPublishRequest.service';

//
// * Wizard Actions Commands
//
// Runs the wizard actions. What still lives in the legacy wizard panel (saving
// and closing) is reached through the wizard controller.
//

type PublishCommand = {
    /** Marks the content as ready on the way, which always needs a save first. */
    markAsReady?: boolean;
    /** Runs for invalid content too. */
    skipValidCheck?: boolean;
    /** Shows every validation message when the content has unsaved changes. */
    showsValidation?: boolean;
    open: (content: ContentSummary) => void;
};

const INVALID_ERROR_KEY = 'notify.publish.invalidError';

const toCompareStatus = (content: ContentSummary): ContentSummaryAndCompareStatus =>
    ContentSummaryAndCompareStatus.fromContentSummary(content);

const PUBLISH_COMMANDS: Partial<Record<WizardActionId, PublishCommand>> = {
    publish: { showsValidation: true, open: (content) => openPublishDialog([content]) },
    publishTree: { showsValidation: true, open: (content) => openPublishDialog([content], true) },
    markAsReady: { markAsReady: true, open: (content) => openPublishDialog([content]) },
    unpublish: { skipValidCheck: true, showsValidation: true, open: (content) => openUnpublishDialog([content]) },
    createIssue: {
        skipValidCheck: true,
        open: (content) => new CreateIssuePromptEvent([toCompareStatus(content)]).fire(),
    },
    requestPublish: {
        open: (content) => new RequestContentPublishPromptEvent([toCompareStatus(content)]).fire(),
    },
};

/** Whether the action saves the content before it opens its dialog. */
export function mustSaveBeforeWizardAction(id: WizardActionId): boolean {
    const controller = getWizardController();
    if (!controller) return false;

    const becomesReady = PUBLISH_COMMANDS[id]?.markAsReady === true && !$wizardIsMarkedAsReady.get();

    return becomesReady || controller.hasUnsavedChanges();
}

function openForPersisted(controller: WizardController, open: (content: ContentSummary) => void): void {
    const content = controller.getPersistedContent();
    if (content) open(content);
}

function runPublishCommand(id: WizardActionId, command: PublishCommand, controller: WizardController): void {
    if (command.showsValidation && controller.hasUnsavedChanges()) escalateVisibility('all');

    const isValid = $wizardContentState.get() !== 'invalid';

    if (!command.skipValidCheck && !isValid) {
        // ? Request publish stays silent for invalid content, as before.
        if (id !== 'requestPublish') notifyWarning(i18n(INVALID_ERROR_KEY));
        return;
    }

    if (!mustSaveBeforeWizardAction(id)) {
        openForPersisted(controller, command.open);
        return;
    }

    patchWizardActionActivity({ busy: id });
    if (command.markAsReady) setWizardMarkedAsReady(true);

    controller
        .save()
        .then((saved) => {
            const canOpen = !command.markAsReady || $wizardContentState.get() !== 'invalid';
            if (saved != null && canOpen) openForPersisted(controller, command.open);
        })
        .catch(handleError)
        .finally(() => patchWizardActionActivity({ busy: undefined }));
}

/** Saves the content the way the Save button does, whether or not the button is enabled. */
export function saveWizardContent(options?: WizardSaveOptions): Promise<void> {
    const controller = getWizardController();
    if (!controller) return Promise.resolve();

    patchWizardActionActivity({ saving: true });

    return controller.save(options).then(
        () => patchWizardActionActivity({ saving: false, saved: true }),
        (error: Error) => {
            patchWizardActionActivity({ saving: false, saved: false });
            handleError(error);
        },
    );
}

export function executeWizardAction(id: WizardActionId): void {
    const controller = getWizardController();
    if (!controller || !$wizardActions.get()[id].enabled) return;

    const publishCommand = PUBLISH_COMMANDS[id];
    if (publishCommand) {
        runPublishCommand(id, publishCommand, controller);
        return;
    }

    switch (id) {
        case 'save':
            void saveWizardContent();
            break;
        case 'saveAndClose':
            void saveWizardContent().then(() => controller.close());
            break;
        case 'archive':
            openForPersisted(controller, (content) => openDeleteDialog([content]));
            break;
        case 'duplicate':
            openForPersisted(controller, (content) => openDuplicateDialog([content]));
            break;
        case 'move':
            openForPersisted(controller, (content) => openMoveDialog([content]));
            break;
        case 'openRequest':
            openWizardPublishRequest();
            break;
        case 'reset':
            resetWizardInheritance();
            break;
        case 'localize':
            localizeWizardContent();
            break;
    }
}
