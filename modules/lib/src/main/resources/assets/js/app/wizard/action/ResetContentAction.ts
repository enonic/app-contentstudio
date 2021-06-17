import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';
import {RestoreInheritRequest} from '../../resource/RestoreInheritRequest';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ContentInheritType} from '../../content/ContentInheritType';

export class ResetContentAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.reset'));

        this.onExecuted(() => {
            new ConfirmationDialog()
                .setQuestion(i18n('dialog.confirm.resetInheritance'))
                .setYesCallback(() => this.restoreContentInheritance(wizardPanel.getContent()))
                .open();
        });
    }

    private restoreContentInheritance(content: ContentSummaryAndCompareStatus) {
        new RestoreInheritRequest()
            .setContentId(content.getContentId())
            .setInherit(this.getInheritTypesToRestore(content))
            .sendAndParse().catch(DefaultErrorHandler.handle);
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
