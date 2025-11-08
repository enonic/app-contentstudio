import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {ComponentType} from '../../../../app/page/region/ComponentType';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

//TODO: Will probably fail because receiver extects AddComponentViewEvent, but will get an Object
export class AddComponentViewEvent
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

    static on(handler: (event: AddComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: AddComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
