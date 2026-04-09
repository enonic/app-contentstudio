import {BasePublishAction} from './BasePublishAction';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {CreateIssuePromptEvent} from '../../browse/CreateIssuePromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import type {ContentSummary} from '../../content/ContentSummary';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class CreateIssueAction extends BasePublishAction {
    constructor(wizard: ContentWizardPanel) {
        super({wizard, label: i18n('action.createIssue'), omitCanPublishCheck: true});
        this.setClass('create-issue');
    }

    protected createPromptEvent(summary: ContentSummary[]): void {
        new CreateIssuePromptEvent(summary.map(s => ContentSummaryAndCompareStatus.fromContentSummary(s))).fire();
    }
}
