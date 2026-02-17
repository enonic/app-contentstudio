import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ComponentPath} from '../../../../app/page/region/ComponentPath';
import {type ComponentType} from '../../../../app/page/region/ComponentType';

export class AddComponentEvent
    extends IframeEvent {

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

    static on(handler: (event: AddComponentEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: AddComponentEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
