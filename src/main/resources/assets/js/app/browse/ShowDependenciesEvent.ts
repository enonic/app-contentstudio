import '../../api.ts';
import ContentId = api.content.ContentId;
import ContentTypeName = api.schema.content.ContentTypeName;

export class ShowDependenciesEvent
    extends api.event.Event {

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
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ShowDependenciesEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
