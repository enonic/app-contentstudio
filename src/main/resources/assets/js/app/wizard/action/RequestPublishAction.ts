import i18n = api.util.i18n;
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
            label: i18n('action.requestPublishMore')
        });

        this.wizard = wizard;

        this.onBeforeExecute(() => {
            if (this.isSaveRequired() || this.wizard.hasUnsavedChanges()) {
                this.wizard.setIsMarkedAsReady(true);
                this.wizard.setIsMarkedAsReadyOnPublish(true);
            }
        });
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new RequestContentPublishPromptEvent(summary).fire();
    }

    protected isSaveRequired(): boolean {
        return this.wizard.getContent().getContentSummary().isInProgress();
    }
}
