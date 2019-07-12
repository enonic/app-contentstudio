import {ContentWizardPanel} from '../ContentWizardPanel';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import DefaultErrorHandler = api.DefaultErrorHandler;

export interface BasePublishActionConfig {
    wizard: ContentWizardPanel;
    label: string;
    shortcut?: string;
    errorMessage?: string;
    omitCanPublishCheck?: boolean;
}

export abstract class BasePublishAction extends api.ui.Action {

    private config: BasePublishActionConfig;

    constructor(config: BasePublishActionConfig) {
        super(config.label, config.shortcut, true);

        this.config = config;
        this.setEnabled(false);

        const callback = () => {
            if (config.wizard.hasUnsavedChanges() || this.isSaveRequired()) {

                this.setEnabled(false);
                config.wizard.saveChanges().then((content) => {
                    if (content) {
                        this.firePromptEvent();
                    }
                }).catch((reason: any) => {
                    DefaultErrorHandler.handle(reason);
                }).finally(() => this.setEnabled(true)).done();

            } else {
                this.firePromptEvent();
            }
        };

        this.onExecuted(() => (config.omitCanPublishCheck ? callback() : this.checkOnExecuted(callback)));
    }

    private firePromptEvent(): void {
        const content = ContentSummaryAndCompareStatus.fromContentSummary(this.config.wizard.getPersistedItem());
        content.setCompareStatus(this.config.wizard.getCompareStatus()).setPublishStatus(this.config.wizard.getPublishStatus());
        this.createPromptEvent([content]);
    }

    private checkOnExecuted(callback: () => void) {
        if (this.config.wizard.checkContentCanBePublished()) {
            this.config.wizard.setRequireValid(true);
            callback();
        } else if (this.config.errorMessage) {
            api.notify.showWarning(this.config.errorMessage);
        }
    }

    protected abstract createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void;

    protected isSaveRequired(): boolean {
        return false;
    }
}
