import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class EditTextComponentViewEvent
    extends IframeEvent {

    private readonly path: string;

    constructor(path: string) {
        super();
        this.path = path;
    }

    getPath(): string {
        return this.path;
    }

    static on(handler: (event: EditTextComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: EditTextComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
