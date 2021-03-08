import {BasePublishAction} from './BasePublishAction';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {ContentPublishPromptEvent} from '../../browse/ContentPublishPromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';

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
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new ContentPublishPromptEvent({model: summary}).fire();
    }
}
