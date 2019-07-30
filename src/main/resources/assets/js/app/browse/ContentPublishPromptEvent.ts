import {BaseContentModelEvent} from './BaseContentModelEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import ContentId = api.content.ContentId;

export class ContentPublishPromptEvent extends BaseContentModelEvent {

    private includeChildItems: boolean;

    private exceptedContentIds: ContentId[];

    constructor(model: ContentSummaryAndCompareStatus[], includeChildItems: boolean = false, exceptedContentIds?: ContentId[]) {
        super(model);
        this.includeChildItems = includeChildItems;
        this.exceptedContentIds = exceptedContentIds;
    }

    isIncludeChildItems(): boolean {
        return this.includeChildItems;
    }

    getExceptedContentIds(): ContentId[] {
        return this.exceptedContentIds;
    }

    static on(handler: (event: ContentPublishPromptEvent) => void) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentPublishPromptEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }
}
