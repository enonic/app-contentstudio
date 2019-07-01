import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MarkAsReadyRequest} from '../../resource/MarkAsReadyRequest';
import Action = api.ui.Action;
import i18n = api.util.i18n;
import ConfirmationDialog = api.ui.dialog.ConfirmationDialog;
import ContentId = api.content.ContentId;

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
        const selectedContents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();
        const contentsToMarkAsReady: ContentId[] = selectedContents.filter(this.canBeMarkedAsReady)
            .map((item: ContentSummaryAndCompareStatus) => item.getContentId());

        this.confirmDialog.setYesCallback(() => {
            new MarkAsReadyRequest(contentsToMarkAsReady).sendAndParse().catch(api.DefaultErrorHandler.handle);
        }).open();
    }

    private canBeMarkedAsReady(item: ContentSummaryAndCompareStatus): boolean {
        return !item.isOnline() && item.getContentSummary().isValid() && !item.getContentSummary().isReady();
    }
}
