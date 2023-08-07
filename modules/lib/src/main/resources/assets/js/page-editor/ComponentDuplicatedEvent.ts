import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {Component} from '../app/page/region/Component';

export class ComponentDuplicatedEvent
    extends Event {

    private originalComponentView: ComponentView;

    private duplicatedComponentView: ComponentView;

    constructor(originalComponentView: ComponentView,
                duplicatedComponentView: ComponentView) {
        super();
        this.originalComponentView = originalComponentView;
        this.duplicatedComponentView = duplicatedComponentView;
    }

    getOriginalComponentView(): ComponentView {
        return this.originalComponentView;
    }

    getDuplicatedComponentView(): ComponentView {
        return this.duplicatedComponentView;
    }

    static on(handler: (event: ComponentDuplicatedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentDuplicatedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
