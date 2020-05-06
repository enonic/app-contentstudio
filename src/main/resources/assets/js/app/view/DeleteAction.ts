import {showError, showSuccess} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';
import {DeleteContentRequest} from '../resource/DeleteContentRequest';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ItemViewPanel} from 'lib-admin-ui/app/view/ItemViewPanel';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';

export class DeleteAction
    extends Action {

    constructor(itemViewPanel: ItemViewPanel<ContentSummaryAndCompareStatus>) {
        super(i18n('action.delete'), 'mod+del');

        let contentToDelete = itemViewPanel.getItem().getModel().getContentSummary();

        const confirmation = new ConfirmationDialog()
            .setQuestion(i18n('dialog.confirm.delete'))
            .setNoCallback(null)
            .setYesCallback(() => {
                itemViewPanel.close();
                new DeleteContentRequest()
                    .addContentPath(contentToDelete.getPath())
                    .sendAndParseWithPolling()
                    .then((message: string) => {
                        showSuccess(message);
                    }).catch((reason: any) => {
                    if (reason && reason.message) {
                        showError(reason.message);
                    } else {
                        showError(i18n('notify.content.deleteError'));
                    }
                }).done();
            });

        this.onExecuted(() => {
            confirmation.open();
        });
    }
}
