import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MarkAsReadyRequest} from '../../resource/MarkAsReadyRequest';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class MarkAsReadyContentAction
    extends ContentTreeGridAction {

    private confirmDialog: ConfirmationDialog;

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.markAsReady'));
        this.setEnabled(false);

        this.confirmDialog = new ConfirmationDialog().setQuestion(i18n('dialog.markAsReady.question'));
    }

    protected handleExecuted() {
        const contentToMarkAsReady: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList().filter(
            (item: ContentSummaryAndCompareStatus) => item.canBeMarkedAsReady()
        );
        const isSingleItem: boolean = contentToMarkAsReady.length === 1;

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

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && state.hasAllValid() && state.canModify() && state.hasAnyCanBeMarkedAsReady();
    }
}
