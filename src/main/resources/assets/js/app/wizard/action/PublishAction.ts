import {BasePublishAction} from './BasePublishAction';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {ContentPublishPromptEvent} from '../../browse/ContentPublishPromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import i18n = api.util.i18n;

export class PublishAction extends BasePublishAction {
    constructor(wizard: ContentWizardPanel) {
        super({
            wizard,
            label: i18n('action.publishMore'),
            shortcut: 'ctrl+alt+p',
            errorMessage: i18n('notify.publish.invalidError')
        });
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new ContentPublishPromptEvent(summary).fire();
    }
}
