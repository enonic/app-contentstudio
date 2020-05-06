import {BasePublishAction} from './BasePublishAction';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {ContentPublishPromptEvent} from '../../browse/ContentPublishPromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';

export class PublishTreeAction extends BasePublishAction {
    constructor(wizard: ContentWizardPanel) {
        super({wizard, label: i18n('action.publishTreeMore'), errorMessage: i18n('notify.publish.invalidError')});
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new ContentPublishPromptEvent({model: summary, includeChildItems: true}).fire();
    }
}
