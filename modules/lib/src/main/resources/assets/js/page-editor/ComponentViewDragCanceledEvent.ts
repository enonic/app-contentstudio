import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {ComponentViewDragStoppedEvent} from './ComponentViewDraggingStoppedEvent';
import {Component} from '../app/page/region/Component';

export class ComponentViewDragCanceledEvent
    extends Event {

    private componentView: ComponentView<Component>;

    constructor(componentView: ComponentView<Component>) {
        super();
        this.componentView = componentView;
    }

    getComponentView(): ComponentView<Component> {
        return this.componentView;
    }

    static on(handler: (event: ComponentViewDragStoppedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentViewDragStoppedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
