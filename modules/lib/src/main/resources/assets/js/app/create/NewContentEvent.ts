import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {type ContentSummary} from '../content/ContentSummary';

export class NewContentEvent
    extends Event {

    private readonly contentType: ContentTypeSummary;

    private readonly parentContent: ContentSummary;

    constructor(contentType: ContentTypeSummary, parentContent: ContentSummary) {
        super();
        this.contentType = contentType;
        this.parentContent = parentContent;
    }

    getContentType(): ContentTypeSummary {
        return this.contentType;
    }

    getParentContent(): ContentSummary {
        return this.parentContent;
    }

    static on(handler: (event: NewContentEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: NewContentEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
