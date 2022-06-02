import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {RegionView} from './RegionView';
import {Component} from '../app/page/region/Component';

export class ComponentAddedEvent
    extends Event {

    private componentView: ComponentView<Component>;
    private parentRegionView: RegionView;
    private dragged: boolean;

    constructor(componentView: ComponentView<Component>, regionView: RegionView, dragged: boolean = false) {
        super();
        this.componentView = componentView;
        this.parentRegionView = regionView;
        this.dragged = dragged;
    }

    getComponentView(): ComponentView<Component> {
        return this.componentView;
    }

    getParentRegionView(): RegionView {
        return this.parentRegionView;
    }

    isDragged(): boolean {
        return this.dragged;
    }

    static on(handler: (event: ComponentAddedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentAddedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
