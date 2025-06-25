import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {RequestContentPublishPromptEvent} from '../../browse/RequestContentPublishPromptEvent';
import {BasePublishAction} from './BasePublishAction';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

export class RequestPublishAction
    extends BasePublishAction {

    private wizard: ContentWizardPanel;

    constructor(wizard: ContentWizardPanel) {
        super({
            wizard,
            label: i18n('action.requestPublish')
        });

        this.wizard = wizard;
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new RequestContentPublishPromptEvent(summary).fire();
    }
}
