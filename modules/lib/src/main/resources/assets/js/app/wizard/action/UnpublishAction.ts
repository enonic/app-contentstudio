import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openUnpublishDialog} from '../../../v6/features/store/dialogs/unpublishDialog.store';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {BasePublishAction} from './BasePublishAction';

export class UnpublishAction extends BasePublishAction {
    constructor() {
        super({label: i18n('action.unpublish'), omitCanPublishCheck: true});
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        openUnpublishDialog(summary);
    }
}
