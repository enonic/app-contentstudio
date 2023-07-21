import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {RegionView} from './RegionView';
import {Component} from '../app/page/region/Component';
import {ComponentPath} from '../app/page/region/ComponentPath';

export class ComponentAddedEvent
    extends Event {

    private readonly path: ComponentPath;
    private readonly type: string;
    private readonly dragged: boolean;

    constructor(path: ComponentPath, type: string, dragged: boolean = false) {
        super();

        this.path = path;
        this.type = type;
        this.dragged = dragged;
    }

    getPath(): ComponentPath {
        return this.path;
    }

    getPathAsString(): string {
        return this.path.toString();
    }

    getType(): string {
        return this.type;
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
