import {BasePublishAction} from './BasePublishAction';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {openUnpublishDialog} from '../../../v6/features/store/dialogs/unpublishDialog.store';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class UnpublishAction extends BasePublishAction {
    constructor(wizard: ContentWizardPanel) {
        super({wizard, label: i18n('action.unpublish'), omitCanPublishCheck: true});
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        openUnpublishDialog(summary);
    }
}
