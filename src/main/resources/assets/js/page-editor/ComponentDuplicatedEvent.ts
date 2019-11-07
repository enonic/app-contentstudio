import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {Component} from '../app/page/region/Component';

export class ComponentDuplicatedEvent
    extends Event {

    private originalComponentView: ComponentView<Component>;

    private duplicatedComponentView: ComponentView<Component>;

    constructor(originalComponentView: ComponentView<Component>,
                duplicatedComponentView: ComponentView<Component>) {
        super();
        this.originalComponentView = originalComponentView;
        this.duplicatedComponentView = duplicatedComponentView;
    }

    getOriginalComponentView(): ComponentView<Component> {
        return this.originalComponentView;
    }

    getDuplicatedComponentView(): ComponentView<Component> {
        return this.duplicatedComponentView;
    }

    static on(handler: (event: ComponentDuplicatedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentDuplicatedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
