import {BasePublishAction} from './BasePublishAction';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {ContentPublishPromptEvent} from '../../browse/ContentPublishPromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import i18n = api.util.i18n;

export class PublishAction extends BasePublishAction {
    private wizard: ContentWizardPanel;
    private userCanPublish: boolean;

    constructor(wizard: ContentWizardPanel) {
        super({
            wizard,
            label: i18n('action.publishMore'),
            shortcut: 'ctrl+alt+p',
            errorMessage: i18n('notify.publish.invalidError')
        });

        this.wizard = wizard;
        this.userCanPublish = false;

        this.onBeforeExecute(() => {
            if (this.userCanPublish && this.wizard.hasUnsavedChanges()) {
                this.wizard.setIsMarkedAsReady(true);
            }
        });
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new ContentPublishPromptEvent(summary).fire();
    }

    public setUserCanPublish(value: boolean) {
        this.userCanPublish = value;
    }
}
