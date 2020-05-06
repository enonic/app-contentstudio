import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from './BaseContentModelEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class ShowNewContentDialogEvent extends BaseContentModelEvent {

    private parentContent: ContentSummaryAndCompareStatus;

    constructor(parentContent: ContentSummaryAndCompareStatus) {
        super([parentContent]);
        this.parentContent = parentContent;
    }

    getParentContent(): ContentSummaryAndCompareStatus {
        return this.parentContent;
    }

    static on(handler: (event: ShowNewContentDialogEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ShowNewContentDialogEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
