import '../../api.ts';
import ContentId = api.content.ContentId;

export class ShowDependenciesEvent
    extends api.event.Event {

    private id: ContentId;

    private inbound: boolean;

    constructor(id: ContentId, inbound: boolean) {
        super();
        this.id = id;
        this.inbound = inbound;
    }

    getId(): ContentId {
        return this.id;
    }

    isInbound(): boolean {
        return this.inbound;
    }

    static on(handler: (event: ShowDependenciesEvent) => void, contextWindow: Window = window) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ShowDependenciesEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
