import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {Component} from '../app/page/region/Component';

export class ComponentResetEvent
    extends Event {

    private newComponentView: ComponentView<Component>;
    private oldComponentView: ComponentView<Component>;

    constructor(newComponentView: ComponentView<Component>, oldComponentView: ComponentView<Component>) {
        super();
        this.newComponentView = newComponentView;
        this.oldComponentView = oldComponentView;
    }

    getNewComponentView(): ComponentView<Component> {
        return this.newComponentView;
    }

    getOldComponentView(): ComponentView<Component> {
        return this.oldComponentView;
    }

    static on(handler: (event: ComponentResetEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentResetEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
