import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class SetComponentStateEvent
    extends Event {

    private readonly path: string;

    private readonly processing: boolean;

    constructor(path: string, processing: boolean) {
        super();
        this.path = path;
        this.processing = processing;
    }

    getPath(): string {
        return this.path;
    }

    isProcessing(): boolean {
        return this.processing;
    }

    static on(handler: (event: SetComponentStateEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SetComponentStateEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
