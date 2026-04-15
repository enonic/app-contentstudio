import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {RequestContentPublishPromptEvent} from '../../browse/RequestContentPublishPromptEvent';
import {BasePublishAction} from './BasePublishAction';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import type {ContentSummary} from '../../content/ContentSummary';

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

    protected createPromptEvent(summary: ContentSummary[]): void {
        new RequestContentPublishPromptEvent(summary.map(s => ContentSummaryAndCompareStatus.fromContentSummary(s))).fire();
    }
}
