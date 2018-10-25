import {ComponentView} from './ComponentView';
import {ComponentType} from '../app/page/region/ComponentType';
import {Component} from '../app/page/region/Component';
import Event = api.event.Event;

export class ComponentDetachedFromFragmentEvent
    extends api.event.Event {

    private componentType: ComponentType;

    private componentView: ComponentView<Component>;

    constructor(componentView: ComponentView<Component>, componentType: ComponentType) {
        super();
        this.componentView = componentView;
        this.componentType = componentType;
    }

    static on(handler: (event: ComponentDetachedFromFragmentEvent) => void, contextWindow: Window = window) {
        Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentDetachedFromFragmentEvent) => void, contextWindow: Window = window) {
        Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    getComponentView(): ComponentView<Component> {
        return this.componentView;
    }

    getComponentType(): ComponentType {
        return this.componentType;
    }
}
