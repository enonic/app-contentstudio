import { Event } from '@enonic/lib-admin-ui/event/Event';
import { ClassHelper } from '@enonic/lib-admin-ui/ClassHelper';
import { type ContentSummary } from '../content/ContentSummary';
import { type ContentTypeName } from '../../v6/shared/lib/cms/schema/contentTypeName';

export class NewContentEvent extends Event {
    private readonly contentTypeName: ContentTypeName;

    private readonly parentContent: ContentSummary;

    constructor(contentTypeName: ContentTypeName, parentContent: ContentSummary) {
        super();
        this.contentTypeName = contentTypeName;
        this.parentContent = parentContent;
    }

    getContentTypeName(): ContentTypeName {
        return this.contentTypeName;
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
