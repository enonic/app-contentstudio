import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MarkAsReadyRequest} from '../../resource/MarkAsReadyRequest';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';

export class MarkAsReadyContentAction
    extends Action {

    private grid: ContentTreeGrid;
    private confirmDialog: ConfirmationDialog;

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.markAsReady'));
        this.setEnabled(false);

        this.grid = grid;
        this.confirmDialog = new ConfirmationDialog().setQuestion(i18n('dialog.markAsReady.question'));

        this.onExecuted(this.handleExecuted.bind(this));
    }

    private handleExecuted() {
        const contentToMarkAsReady = this.grid.getSelectedDataList().filter(
            (item: ContentSummaryAndCompareStatus) => item.canBeMarkedAsReady()
        );
        const isSingleItem = contentToMarkAsReady.length === 1;

        if (isSingleItem) {
            MarkAsReadyContentAction.markAsReady(contentToMarkAsReady);
        } else {
            this.confirmDialog.setYesCallback(() => {
                MarkAsReadyContentAction.markAsReady(contentToMarkAsReady);
            }).open();
        }
    }

    private static markAsReady(content: ContentSummaryAndCompareStatus[]): Q.Promise<void> {
        const contentIds = content.map(item => item.getContentId());
        const isSingleItem = content.length === 1;
        return new MarkAsReadyRequest(contentIds).sendAndParse().then(() => {
            if (isSingleItem) {
                const name = content[0].getContentSummary().getName();
                showFeedback(i18n('notify.item.markedAsReady', name));
            } else {
                showFeedback(i18n('notify.item.markedAsReady.multiple', content.length));
            }
        }).catch(DefaultErrorHandler.handle);
    }
}
