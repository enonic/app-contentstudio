import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';

export class DuplicateComponentEvent
    extends Event {

    private readonly path: ComponentPath;

    constructor(path: ComponentPath) {
        super();
        this.path = path;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    static on(handler: (event: DuplicateComponentEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: DuplicateComponentEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
