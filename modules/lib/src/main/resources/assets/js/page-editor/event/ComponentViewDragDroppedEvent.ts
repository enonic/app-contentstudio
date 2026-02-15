import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ComponentPath} from '../../app/page/region/ComponentPath';

export class ComponentViewDragDroppedEvent
    extends IframeEvent {

    private readonly from: ComponentPath;
    private readonly to: ComponentPath;

    constructor(from: ComponentPath, to: ComponentPath) {
        super();

        this.from = from;
        this.to = to;
    }

    getFromPath(): ComponentPath {
        return this.from;
    }

    getToPath(): ComponentPath {
        return this.to;
    }

    static on(handler: (event: ComponentViewDragDroppedEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentViewDragDroppedEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
