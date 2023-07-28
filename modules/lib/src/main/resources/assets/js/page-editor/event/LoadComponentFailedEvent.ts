import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../app/page/region/ComponentPath';

export class LoadComponentFailedEvent
    extends Event {

    private readonly path: ComponentPath;

    private readonly error: any;
    constructor(path: ComponentPath, error: any) {
        super();
        this.path = path;
        this.error = error;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    getError(): any {
        return this.error;
    }

    static on(handler: (event: LoadComponentFailedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LoadComponentFailedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
