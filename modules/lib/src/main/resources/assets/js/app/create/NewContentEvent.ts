import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {Content} from '../content/Content';

export class NewContentEvent
    extends Event {

    private contentType: ContentTypeSummary;

    private parentContent: Content;

    constructor(contentType: ContentTypeSummary, parentContent: Content) {
        super();
        this.contentType = contentType;
        this.parentContent = parentContent;
    }

    getContentType(): ContentTypeSummary {
        return this.contentType;
    }

    getParentContent(): Content {
        return this.parentContent;
    }

    static on(handler: (event: NewContentEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: NewContentEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
