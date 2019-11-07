import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {Component} from '../app/page/region/Component';

export class ComponentInspectedEvent
    extends Event {

    private componentView: ComponentView<Component>;

    constructor(componentView?: ComponentView<Component>) {
        super();
        this.componentView = componentView;
    }

    getComponentView(): ComponentView<Component> {
        return this.componentView;
    }

    static on(handler: (event: ComponentInspectedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentInspectedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
