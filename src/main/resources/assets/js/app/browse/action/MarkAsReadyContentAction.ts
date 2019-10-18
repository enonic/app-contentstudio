import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MarkAsReadyRequest} from '../../resource/MarkAsReadyRequest';
import Action = api.ui.Action;
import i18n = api.util.i18n;
import ConfirmationDialog = api.ui.dialog.ConfirmationDialog;

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

    private static markAsReady(content: ContentSummaryAndCompareStatus[]): wemQ.Promise<void> {
        const contentIds = content.map(item => item.getContentId());
        const isSingleItem = content.length === 1;
        return new MarkAsReadyRequest(contentIds).sendAndParse().then(() => {
            if (isSingleItem) {
                const name = content[0].getContentSummary().getName();
                api.notify.showFeedback(i18n('notify.item.markedAsReady', name));
            } else {
                api.notify.showFeedback(i18n('notify.item.markedAsReady.multiple', content.length));
            }
        }).catch(api.DefaultErrorHandler.handle);
    }
}
