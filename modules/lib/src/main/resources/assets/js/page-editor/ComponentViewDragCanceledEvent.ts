import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';

export class ComponentViewDragCanceledEvent
    extends Event {

    private readonly componentView: ComponentView;

    constructor(componentView: ComponentView) {
        super();
        this.componentView = componentView;
    }

    getComponentView(): ComponentView {
        return this.componentView;
    }

    static on(handler: (event: ComponentViewDragCanceledEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentViewDragCanceledEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
