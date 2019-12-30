import {BasePublishAction} from './BasePublishAction';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {CreateIssuePromptEvent} from '../../browse/CreateIssuePromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';

export class CreateIssueAction extends BasePublishAction {
    constructor(wizard: ContentWizardPanel) {
        super({wizard, label: i18n('action.createTaskMore'), omitCanPublishCheck: true});
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new CreateIssuePromptEvent(summary).fire();
    }
}
