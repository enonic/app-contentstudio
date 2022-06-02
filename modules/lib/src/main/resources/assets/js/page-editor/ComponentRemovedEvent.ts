import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {RegionView} from './RegionView';
import {Component} from '../app/page/region/Component';

export class ComponentRemovedEvent
    extends Event {

    private componentView: ComponentView<Component>;
    private parentRegionView: RegionView;

    constructor(componentView: ComponentView<Component>, regionView: RegionView) {
        super();
        this.componentView = componentView;
        this.parentRegionView = regionView;
    }

    getComponentView(): ComponentView<Component> {
        return this.componentView;
    }

    getParentRegionView(): RegionView {
        return this.parentRegionView;
    }

    static on(handler: (event: ComponentRemovedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentRemovedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
