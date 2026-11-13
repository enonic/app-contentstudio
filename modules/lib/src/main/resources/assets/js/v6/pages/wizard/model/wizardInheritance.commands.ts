import { ContentInheritType } from '../../../../app/content/ContentInheritType';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { GetContentByIdRequest } from '../../../../app/resource/GetContentByIdRequest';
import { LocalizeContentsRequest } from '../../../../app/resource/LocalizeContentsRequest';
import { RestoreInheritRequest } from '../../../../app/resource/RestoreInheritRequest';
import { getActiveProject } from '../../../entities/project/activeProject.store';
import { i18n } from '../../../shared/i18n';
import { handleError, notifySuccess } from '../../../shared/notifications';
import { DialogPresetConfirmElement } from '../../../shared/ui/dialogs/DialogPreset';
import { patchWizardActionActivity } from './wizardActions.store';
import { setWizardReadOnly } from './wizardContent.store';
import { getWizardController, type WizardController } from './wizardController';

//
// * Wizard Inheritance Commands
//
// Reset and Localize for content inherited from a parent project: the first
// gives the content back to the parent project, the second takes it over.
//

export function resolveInheritTypesToRestore(content: ContentSummary): ContentInheritType[] {
    const result: ContentInheritType[] = [];

    if (!content.isDataInherited()) result.push(ContentInheritType.CONTENT);
    if (!content.isSortInherited()) result.push(ContentInheritType.SORT);
    if (!content.isParentInherited()) result.push(ContentInheritType.PARENT);
    if (!content.isNameInherited()) result.push(ContentInheritType.NAME);

    return result;
}

async function restoreInheritance(controller: WizardController, summary: ContentSummary): Promise<void> {
    const contentId = summary.getContentId();

    await new RestoreInheritRequest()
        .setContentId(contentId)
        .setInherit(resolveInheritTypesToRestore(summary))
        .sendAndParse();
    const content = await new GetContentByIdRequest(contentId).sendAndParse();

    const refreshed = controller.replaceContent(content, false);
    notifySuccess(i18n('notify.content.reset'));
    setWizardReadOnly(true);
    await refreshed;
}

export function resetWizardInheritance(): void {
    const controller = getWizardController();
    const summary = controller?.getPersistedContent();
    if (!controller || !summary) return;

    const dialog = new DialogPresetConfirmElement({
        open: true,
        title: i18n('dialog.confirm.title'),
        description: i18n('dialog.confirm.resetInheritance'),
        onConfirm: () => {
            dialog.close();
            restoreInheritance(controller, summary).catch(handleError);
        },
        onCancel: () => dialog.close(),
    });
    dialog.open();
}

async function localize(controller: WizardController, summary: ContentSummary): Promise<void> {
    const contentId = summary.getContentId();
    const language = getActiveProject().getLanguage();

    await new LocalizeContentsRequest([contentId], language).sendAndParse();
    const content = await new GetContentByIdRequest(contentId).sendAndParse();

    const refreshed = controller.replaceContent(content, true);
    notifySuccess(i18n('notify.content.localized'));
    setWizardReadOnly(false);
    controller.openTranslator(language);
    await refreshed;
}

export function localizeWizardContent(): void {
    const controller = getWizardController();
    const summary = controller?.getPersistedContent();
    if (!controller || !summary) return;

    patchWizardActionActivity({ busy: 'localize' });

    localize(controller, summary)
        .catch(handleError)
        .finally(() => patchWizardActionActivity({ busy: undefined }));
}
