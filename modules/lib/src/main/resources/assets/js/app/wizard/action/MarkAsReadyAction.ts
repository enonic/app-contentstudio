import {BasePublishAction} from './BasePublishAction';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openPublishDialog} from '../../../v6/features/store/dialogs/publishDialog.store';

export class MarkAsReadyAction extends BasePublishAction {

    constructor() {
        super({
            label: i18n('action.markAsReady'),
            shortcut: 'ctrl+alt+r',
            errorMessage: i18n('notify.publish.invalidError'),
            markAsReady: true,
        });
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        openPublishDialog(summary);
    }
}
