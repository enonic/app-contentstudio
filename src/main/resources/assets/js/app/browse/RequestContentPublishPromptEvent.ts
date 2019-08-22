import {BaseContentModelEvent} from './BaseContentModelEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class RequestContentPublishPromptEvent
    extends BaseContentModelEvent {

    private includeChildItems: boolean;

    constructor(model: ContentSummaryAndCompareStatus[], includeChildItems: boolean = false) {
        super(model);
        this.includeChildItems = includeChildItems;
    }

    isIncludeChildItems(): boolean {
        return this.includeChildItems;
    }

    static on(handler: (event: RequestContentPublishPromptEvent) => void) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: RequestContentPublishPromptEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }
}
