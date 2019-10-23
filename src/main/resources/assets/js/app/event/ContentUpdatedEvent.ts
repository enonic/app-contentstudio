import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';

export class ContentUpdatedEvent
    extends Event {

    private contentSummary: ContentSummary;

    constructor(contentSummary: ContentSummary) {
        super();
        this.contentSummary = contentSummary;
    }

    public getContentId(): ContentId {
        return this.contentSummary.getContentId();
    }

    public getContentSummary(): ContentSummary {
        return this.contentSummary;
    }

    static on(handler: (event: ContentUpdatedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentUpdatedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
