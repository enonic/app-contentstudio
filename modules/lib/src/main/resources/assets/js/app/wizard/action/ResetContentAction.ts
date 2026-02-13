import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {RestoreInheritRequest} from '../../resource/RestoreInheritRequest';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ContentInheritType} from '../../content/ContentInheritType';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';

export class ResetContentAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.reset'));

        this.onExecuted(() => {
            new ConfirmationDialog()
                .setQuestion(i18n('dialog.confirm.resetInheritance'))
                .setYesCallback(() => this.restoreContentInheritance(wizardPanel))
                .open();
        });
    }

    private restoreContentInheritance(wizardPanel: ContentWizardPanel) {
        new RestoreInheritRequest()
            .setContentId(wizardPanel.getContent().getContentId())
            .setInherit(this.getInheritTypesToRestore(wizardPanel.getContent()))
            .sendAndParse()
            .then(() => {
                showFeedback(i18n('notify.content.reset'));
                wizardPanel.setEnabled(false);
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
