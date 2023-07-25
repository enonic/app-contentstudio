import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class SelectComponentRequestedEvent
    extends Event {

    private readonly path: string;

    private readonly silent: boolean;

    constructor(path: string, silent: boolean = true) {
        super();
        this.path = path;
        this.silent = silent;
    }

    getPath(): string {
        return this.path;
    }

    isSilent(): boolean {
        return this.silent;
    }

    static on(handler: (event: SelectComponentRequestedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SelectComponentRequestedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
