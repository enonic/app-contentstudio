import {BasePublishAction} from './BasePublishAction';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openPublishDialog} from '../../../v6/features/store/dialogs/publishDialog.store';

export class PublishTreeAction extends BasePublishAction {
    constructor() {
        super({label: i18n('action.publishTree'), errorMessage: i18n('notify.publish.invalidError')});
        this.setClass('publish-tree');
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        openPublishDialog(summary, true);
    }
}
