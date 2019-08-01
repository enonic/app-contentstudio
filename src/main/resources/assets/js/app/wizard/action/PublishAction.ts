import {BasePublishAction} from './BasePublishAction';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {ContentPublishPromptEvent} from '../../browse/ContentPublishPromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import i18n = api.util.i18n;

export class PublishAction extends BasePublishAction {
    private wizard: ContentWizardPanel;

    constructor(wizard: ContentWizardPanel) {
        super({
            wizard,
            label: i18n('action.publishMore'),
            shortcut: 'ctrl+alt+p',
            errorMessage: i18n('notify.publish.invalidError')
        });

        this.wizard = wizard;

        this.onBeforeExecute(() => {
            if (this.wizard.getContent().getContentSummary().isInProgress() || this.wizard.hasUnsavedChanges()) {
                this.wizard.setIsMarkedAsReady(true);
                this.wizard.setIsMarkedAsReadyOnPublish(true);
            }
        });
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new ContentPublishPromptEvent({model: summary}).fire();
    }


    protected isSaveRequired(): boolean {
        return this.wizard.getContent().getContentSummary().isInProgress();
    }
}
