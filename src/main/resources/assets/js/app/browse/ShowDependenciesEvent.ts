import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';

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
