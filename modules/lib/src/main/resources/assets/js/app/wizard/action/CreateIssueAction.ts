import {BasePublishAction} from './BasePublishAction';
import {CreateIssuePromptEvent} from '../../browse/CreateIssuePromptEvent';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class CreateIssueAction extends BasePublishAction {
    constructor() {
        super({label: i18n('action.createIssue'), omitCanPublishCheck: true});
        this.setClass('create-issue');
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new CreateIssuePromptEvent(summary).fire();
    }
}
