import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';

export class ComponentViewDragCanceledEvent
    extends IframeEvent {

    private readonly componentView: ComponentView;

    constructor(componentView: ComponentView) {
        super();
        this.componentView = componentView;
    }

    getComponentView(): ComponentView {
        return this.componentView;
    }

    static on(handler: (event: ComponentViewDragCanceledEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentViewDragCanceledEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
