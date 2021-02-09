import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';

export class ContentRequiresSaveEvent
    extends Event {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    static on(handler: (event: ContentRequiresSaveEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentRequiresSaveEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
