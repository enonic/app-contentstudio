import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {ComponentType} from '../app/page/region/ComponentType';
import {Component} from '../app/page/region/Component';

export class ComponentDetachedFromFragmentEvent
    extends Event {

    private componentType: ComponentType;

    private componentView: ComponentView<Component>;

    constructor(componentView: ComponentView<Component>, componentType: ComponentType) {
        super();
        this.componentView = componentView;
        this.componentType = componentType;
    }

    static on(handler: (event: ComponentDetachedFromFragmentEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentDetachedFromFragmentEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    getComponentView(): ComponentView<Component> {
        return this.componentView;
    }

    getComponentType(): ComponentType {
        return this.componentType;
    }
}
