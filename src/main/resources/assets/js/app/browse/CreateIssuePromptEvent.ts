import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from './BaseContentModelEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class CreateIssuePromptEvent extends BaseContentModelEvent {

    constructor(model: ContentSummaryAndCompareStatus[]) {
        super(model);
    }

    static on(handler: (event: CreateIssuePromptEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: CreateIssuePromptEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
