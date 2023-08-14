import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class EditTextComponentViewEvent
    extends Event {

    private readonly path: string;

    constructor(path: string) {
        super();
        this.path = path;
    }

    getPath(): string {
        return this.path;
    }

    static on(handler: (event: EditTextComponentViewEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: EditTextComponentViewEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
