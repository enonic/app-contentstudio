import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {$wizardContentState, $wizardHasChanges, $wizardIsMarkedAsReady, setWizardMarkedAsReady} from '../../../v6/features/store/wizardContent.store';
import {$wizardPersistedContent, $wizardCompareStatus, $wizardPublishStatus, saveWizardContent, setWizardRequireValid} from '../../../v6/features/store/wizardSave.store';

export interface BasePublishActionConfig {
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
                    setWizardMarkedAsReady(true);
                }

                saveWizardContent().then((context) => {
                    const content = context.content;
                    const canPublish = !config.markAsReady || $wizardContentState.get() !== 'invalid';
                    if (content != null && canPublish) {
                        this.firePromptEvent();
                    }
                }).catch((reason) => {
                    DefaultErrorHandler.handle(reason);
                }).finally(() => this.setEnabled(true));

            } else {
                this.firePromptEvent();
            }
        };

        this.onExecuted(() => (config.omitCanPublishCheck ? callback() : this.checkOnExecuted(callback)));
    }

    private firePromptEvent(): void {
        const content = $wizardPersistedContent.get();
        if (!content) {
            return;
        }

        const summary = ContentSummaryAndCompareStatus.fromContentSummary(content);
        const compareStatus = $wizardCompareStatus.get();
        const publishStatus = $wizardPublishStatus.get();

        if (compareStatus != null) {
            summary.setCompareStatus(compareStatus);
        }
        if (publishStatus != null) {
            summary.setPublishStatus(publishStatus);
        }

        this.createPromptEvent([summary]);
    }

    private checkOnExecuted(callback: () => void) {
        if ($wizardContentState.get() !== 'invalid') {
            setWizardRequireValid(true);
            callback();
        } else if (this.config.errorMessage) {
            showWarning(this.config.errorMessage);
        }
    }

    protected abstract createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void;

    mustSaveBeforeExecution(): boolean {
        const isReadyStateChanged = this.config.markAsReady && !$wizardIsMarkedAsReady.get();
        return isReadyStateChanged || $wizardHasChanges.get();
    }
}
