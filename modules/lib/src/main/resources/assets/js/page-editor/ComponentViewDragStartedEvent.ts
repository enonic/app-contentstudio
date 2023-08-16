import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {Component} from '../app/page/region/Component';
import {ComponentPath} from '../app/page/region/ComponentPath';

export class ComponentViewDragStartedEvent
    extends Event {

    private readonly path: ComponentPath;

    constructor(path: ComponentPath) {
        super();
        this.path = path;
    }

    getPath(): ComponentPath {
        return this.path;
    }

    static on(handler: (event: ComponentViewDragStartedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentViewDragStartedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
