import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class EditTextComponentRequested
    extends Event {

    private readonly path: string;

    constructor(path: string) {
        super();
        this.path = path;
    }

    getPath(): string {
        return this.path;
    }

    static on(handler: (event: EditTextComponentRequested) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: EditTextComponentRequested) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
