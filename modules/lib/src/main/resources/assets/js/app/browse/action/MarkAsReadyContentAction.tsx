import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DialogPresetConfirmElement} from '../../../v6/features/shared/dialogs/DialogPreset';
import {getCurrentItemsAsCSCS} from '../../../v6/features/store/contentTreeSelection.store';
import {openPublishDialog} from '../../../v6/features/store/dialogs/publishDialog.store';
import type {ContentId} from '../../content/ContentId';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MarkAsReadyRequest} from '../../resource/MarkAsReadyRequest';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class MarkAsReadyContentAction
    extends ContentTreeGridAction {

    private canPublish: boolean;

    constructor() {
        super(i18n('action.markAsReady'));

        this.setEnabled(false).setClass('mark-as-ready');

        this.canPublish = false;

    }

    protected handleExecuted() {
        const content: ContentSummaryAndCompareStatus[] = [...getCurrentItemsAsCSCS()];
        const contentToMarkAsReady: ContentSummaryAndCompareStatus[] = [...getCurrentItemsAsCSCS()]
            .filter((item: ContentSummaryAndCompareStatus) => item.canBeMarkedAsReady());
        const isSingleItem: boolean = contentToMarkAsReady.length === 1;

        if (isSingleItem) {
            this.markAsReadyAndPublish(contentToMarkAsReady, content);
        } else {
            const dialog = new DialogPresetConfirmElement({
                open: true,
                title: i18n('dialog.markAsReady.title'),
                description: i18n('dialog.markAsReady.question'),
                onConfirm: () => {
                    dialog.close();
                    void this.markAsReadyAndPublish(contentToMarkAsReady, content);
                },
                onCancel: () => dialog.close(),
            });

            dialog.open();
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
                openPublishDialog(contentToPublish.map(item => item.getContentSummary()));
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
