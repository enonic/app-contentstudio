import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class CreateOrDestroyDraggableEvent
    extends Event {

    private readonly item: JQuery;

    private readonly create: boolean;

    constructor(item: JQuery, create: boolean) {
        super();

        this.item = item;
        this.create = create;
    }

    isCreate(): boolean {
        return this.create;
    }

    getItem(): JQuery {
        return this.item;
    }

    static on(handler: (event: CreateOrDestroyDraggableEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: CreateOrDestroyDraggableEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
