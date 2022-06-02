import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {RegionView} from './RegionView';
import {Component} from '../app/page/region/Component';

export class ComponentViewDragDroppedEvent
    extends Event {

    private componentView: ComponentView<Component>;
    private regionView: RegionView;

    constructor(view: ComponentView<Component>, region: RegionView) {
        super();

        this.componentView = view;
        this.regionView = region;
    }

    getComponentView(): ComponentView<Component> {
        return this.componentView;
    }

    getRegionView(): RegionView {
        return this.regionView;
    }

    static on(handler: (event: ComponentViewDragDroppedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentViewDragDroppedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
