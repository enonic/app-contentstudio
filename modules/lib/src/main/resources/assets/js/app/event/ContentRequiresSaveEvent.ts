import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ContentId} from '../content/ContentId';

export class ContentRequiresSaveEvent
    extends Event {

    private readonly contentId: ContentId;

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
