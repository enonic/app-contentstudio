import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentId} from '../content/ContentId';

export class ShowDependenciesEvent
    extends Event {

    private id: ContentId;

    private inbound: boolean;

    private contentType: ContentTypeName;

    constructor(id: ContentId, inbound: boolean, contentType?: ContentTypeName) {
        super();
        this.id = id;
        this.inbound = inbound;
        this.contentType = contentType;
    }

    getId(): ContentId {
        return this.id;
    }

    isInbound(): boolean {
        return this.inbound;
    }

    getContentType(): ContentTypeName {
        return this.contentType;
    }

    static on(handler: (event: ShowDependenciesEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ShowDependenciesEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
