import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ContentSummary} from '../content/ContentSummary';
import {type ContentId} from '../content/ContentId';

export class ContentUpdatedEvent
    extends Event {

    private readonly contentSummary: ContentSummary;

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
