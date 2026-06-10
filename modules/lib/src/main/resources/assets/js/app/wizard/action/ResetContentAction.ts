import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {RestoreInheritRequest} from '../../resource/RestoreInheritRequest';
import {GetContentByIdRequest} from '../../resource/GetContentByIdRequest';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentInheritType} from '../../content/ContentInheritType';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {DialogPresetConfirmElement} from '../../../v6/features/shared/dialogs/DialogPreset';
import {setWizardReadOnly} from '../../../v6/features/store/wizardContent.store';

export class ResetContentAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.reset'));

        this.onExecuted(() => {
            const dialog = new DialogPresetConfirmElement({
                open: true,
                title: i18n('dialog.confirm.title'),
                description: i18n('dialog.confirm.resetInheritance'),
                onConfirm: () => {
                    dialog.close();
                    this.restoreContentInheritance(wizardPanel);
                },
                onCancel: () => dialog.close()
            });
            dialog.open();
        });
    }

    private restoreContentInheritance(wizardPanel: ContentWizardPanel) {
        const contentId = wizardPanel.getContent().getContentId();

        new RestoreInheritRequest()
            .setContentId(contentId)
            .setInherit(this.getInheritTypesToRestore(wizardPanel.getContent()))
            .sendAndParse()
            .then(() => new GetContentByIdRequest(contentId).sendAndParse())
            .then((content) => {
                wizardPanel.replacePersistedContent(content);

                const wizardActions = wizardPanel.getWizardActions();
                wizardActions.setContent(wizardPanel.getContent()).refreshState();

                showFeedback(i18n('notify.content.reset'));
                wizardPanel.setEnabled(false);
                setWizardReadOnly(true);

                return wizardActions.refreshActions();
            })
            .catch(DefaultErrorHandler.handle);
    }

    private getInheritTypesToRestore(content: ContentSummaryAndCompareStatus): ContentInheritType[] {
        const result: ContentInheritType[] = [];

        if (!content.isDataInherited()) {
            result.push(ContentInheritType.CONTENT);
        }

        if (!content.isSortInherited()) {
            result.push(ContentInheritType.SORT);
        }

        if (!content.isParentInherited()) {
            result.push(ContentInheritType.PARENT);
        }

        if (!content.isNameInherited()) {
            result.push(ContentInheritType.NAME);
        }

        return result;
    }
}
