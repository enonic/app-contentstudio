import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

// TODO: will probably fail, because receiver expects LoadComponentFailedEvent, but will get an Object
export class LoadComponentFailedEvent
    extends IframeEvent {

    private readonly path: ComponentPath;

    private readonly error: unknown;
    constructor(path: ComponentPath, error: unknown) {
        super();
        this.path = path;
        this.error = error;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    getError(): unknown {
        return this.error;
    }

    static on(handler: (event: LoadComponentFailedEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LoadComponentFailedEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
