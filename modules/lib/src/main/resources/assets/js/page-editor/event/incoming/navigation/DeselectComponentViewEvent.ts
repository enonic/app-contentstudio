import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class DeselectComponentViewEvent
    extends IframeEvent {

    private readonly path?: string;

    private readonly silent: boolean;

    constructor(path?: string, silent: boolean = true) {
        super();
        this.path = path;
    }

    getPath(): string {
        return this.path;
    }

    isSilent(): boolean {
        return this.silent;
    }

    static on(handler: (event: DeselectComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: DeselectComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
