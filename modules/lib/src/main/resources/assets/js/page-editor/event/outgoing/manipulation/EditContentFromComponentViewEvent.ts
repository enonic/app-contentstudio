import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class EditContentFromComponentViewEvent
    extends Event {

    private readonly id: string;
    constructor(id: string) {
        super();

        this.id = id;
    }

    getId(): string {
        return this.id;
    }

    static on(handler: (event: EditContentFromComponentViewEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: EditContentFromComponentViewEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
