import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

// TODO: will probably fail, because receiver expects DuplicateComponentViewEvent, but will get an Object
export class DuplicateComponentViewEvent
    extends IframeEvent {

    private readonly path: ComponentPath;

    constructor(path: ComponentPath) {
        super();
        this.path = path;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    static on(handler: (event: DuplicateComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: DuplicateComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
