import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../app/page/region/ComponentPath';
import {ComponentType} from '../../app/page/region/ComponentType';

export class AddComponentRequest
    extends Event {

    private readonly path: ComponentPath;

    private readonly type: ComponentType;
    constructor(path: ComponentPath, type: ComponentType) {
        super();
        this.path = path;
        this.type = type;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    getComponentType(): ComponentType {
        return this.type;
    }

    static on(handler: (event: AddComponentRequest) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: AddComponentRequest) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
