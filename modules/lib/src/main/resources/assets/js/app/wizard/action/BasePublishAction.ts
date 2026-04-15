import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import type {ContentSummary} from '../../content/ContentSummary';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {$wizardContentState} from '../../../v6/features/store/wizardContent.store';

export interface BasePublishActionConfig {
    wizard: ContentWizardPanel;
    label: string;
    shortcut?: string;
    errorMessage?: string;
    omitCanPublishCheck?: boolean;
    markAsReady?: boolean;
}

export abstract class BasePublishAction
    extends Action {

    private config: BasePublishActionConfig;

    constructor(config: BasePublishActionConfig) {
        super(config.label, config.shortcut, true);

        this.config = config;
        this.setEnabled(false);

        const callback = () => {
            if (this.mustSaveBeforeExecution()) {

                this.setEnabled(false);

                if (config.markAsReady) {
                    config.wizard.setMarkedAsReady(true);
                }

                this.config.wizard.saveChanges().then((content) => {
                    const canPublish = !config.markAsReady || $wizardContentState.get() !== 'invalid';
                    if (content != null && canPublish) {
                        this.firePromptEvent();
                    }
                }).catch((reason) => {
                    DefaultErrorHandler.handle(reason);
                }).finally(() => this.setEnabled(true)).done();

            } else {
                this.firePromptEvent();
            }
        };

        this.onExecuted(() => (config.omitCanPublishCheck ? callback() : this.checkOnExecuted(callback)));
    }

    private firePromptEvent(): void {
        this.createPromptEvent([this.config.wizard.getPersistedItem()]);
    }

    private checkOnExecuted(callback: () => void) {
        if ($wizardContentState.get() !== 'invalid') {
            this.config.wizard.setRequireValid(true);
            callback();
        } else if (this.config.errorMessage) {
            showWarning(this.config.errorMessage);
        }
    }

    protected abstract createPromptEvent(summary: ContentSummary[]): void;

    mustSaveBeforeExecution(): boolean {
        const isReadyStateChanged = this.config.markAsReady && !this.config.wizard.isMarkedAsReady();
        return isReadyStateChanged || this.config.wizard.hasUnsavedChanges();
    }
}
