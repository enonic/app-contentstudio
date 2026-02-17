import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MarkAsReadyRequest} from '../../resource/MarkAsReadyRequest';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {ContentPublishPromptEvent} from '../ContentPublishPromptEvent';
import {type ContentId} from '../../content/ContentId';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class MarkAsReadyContentAction
    extends ContentTreeGridAction {

    private canPublish: boolean;

    private confirmDialog: ConfirmationDialog;

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        super(grid, i18n('action.markAsReady'));

        this.setEnabled(false).setClass('mark-as-ready');

        this.canPublish = false;

        this.confirmDialog = new ConfirmationDialog().setQuestion(i18n('dialog.markAsReady.question'));
    }

    protected handleExecuted() {
        const content: ContentSummaryAndCompareStatus[] = this.grid.getSelectedItems();
        const contentToMarkAsReady: ContentSummaryAndCompareStatus[] = this.grid.getSelectedItems()
            .filter((item: ContentSummaryAndCompareStatus) => item.canBeMarkedAsReady());
        const isSingleItem: boolean = contentToMarkAsReady.length === 1;

        if (isSingleItem) {
            this.markAsReadyAndPublish(contentToMarkAsReady, content);
        } else {
            this.confirmDialog.setYesCallback(() => void this.markAsReadyAndPublish(contentToMarkAsReady, content)).open();
        }
    }

    private markAsReadyAndPublish(
        contentToMark: ContentSummaryAndCompareStatus[],
        contentToPublish: ContentSummaryAndCompareStatus[]
    ): Q.Promise<void> {
        const contentIds: ContentId[] = contentToMark.map(item => item.getContentId());
        const isSingleItem: boolean = contentToMark.length === 1;
        return new MarkAsReadyRequest(contentIds).sendAndParse().then(() => {
            if (isSingleItem) {
                const name = contentToMark[0].getContentSummary().getName();
                showFeedback(i18n('notify.item.markedAsReady', name));
            } else {
                showFeedback(i18n('notify.item.markedAsReady.multiple', contentToMark.length));
            }
        }).then(() => {
            if (this.canPublish) {
                new ContentPublishPromptEvent({model: contentToPublish}).fire();
            }
        }).catch(DefaultErrorHandler.handle);
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && state.hasAllValid() && state.canModify() && state.hasAnyCanBeMarkedAsReady();
    }

    setEnabledByState(state: ContentTreeGridItemsState): Action {
        this.canPublish = state.isReadyForPublishing();

        return super.setEnabledByState(state);
    }
}
