import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

//TODO: will probably fail, because receiver expects SetComponentStateEvent, but will get an Object
export class SetComponentStateEvent
    extends IframeEvent {

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
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SetComponentStateEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
