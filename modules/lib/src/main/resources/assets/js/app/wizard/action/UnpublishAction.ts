import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openUnpublishDialog} from '../../../v6/features/store/dialogs/unpublishDialog.store';
import type {ContentSummary} from '../../content/ContentSummary';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {BasePublishAction} from './BasePublishAction';

export class UnpublishAction extends BasePublishAction {
    constructor(wizard: ContentWizardPanel) {
        super({wizard, label: i18n('action.unpublish'), omitCanPublishCheck: true});
    }

    protected createPromptEvent(summary: ContentSummary[]): void {
        openUnpublishDialog(summary);
    }
}
