import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../app/page/region/ComponentPath';

export class ComponentViewDragStoppedEvent
    extends Event {

    private readonly path: ComponentPath;

    constructor(path: ComponentPath) {
        super();
        this.path = path;
    }

    getPath(): ComponentPath {
        return this.path;
    }

    static on(handler: (event: ComponentViewDragStoppedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentViewDragStoppedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
