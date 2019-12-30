import {BasePublishAction} from './BasePublishAction';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {ContentUnpublishPromptEvent} from '../../browse/ContentUnpublishPromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';

export class UnpublishAction extends BasePublishAction {
    constructor(wizard: ContentWizardPanel) {
        super({wizard, label: i18n('action.unpublishMore'), omitCanPublishCheck: true});
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new ContentUnpublishPromptEvent(summary).fire();
    }
}
