import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ComponentPath} from '../../app/page/region/ComponentPath';

export class ComponentLoadedEvent
    extends IframeEvent {

    private readonly newComponentPath: ComponentPath;

    constructor(newComponentPath: ComponentPath) {
        super();
        this.newComponentPath = newComponentPath;
    }

    getPath(): ComponentPath {
        return this.newComponentPath;
    }

    static on(handler: (event: ComponentLoadedEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentLoadedEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
