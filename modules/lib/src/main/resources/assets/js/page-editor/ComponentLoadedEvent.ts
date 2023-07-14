import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {Component} from '../app/page/region/Component';
import {ComponentPath} from '../app/page/region/ComponentPath';

export class ComponentLoadedEvent
    extends Event {

    private readonly newComponentView: ComponentView<Component>;

    constructor(newComponentView: ComponentView<Component>) {
        super();
        this.newComponentView = newComponentView;
    }

    getNewComponentView(): ComponentView<Component> {
        return this.newComponentView;
    }

    getPath(): ComponentPath {
        return this.newComponentView.getPath();
    }

    static on(handler: (event: ComponentLoadedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentLoadedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
