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
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ShowNewContentDialogEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }
}
