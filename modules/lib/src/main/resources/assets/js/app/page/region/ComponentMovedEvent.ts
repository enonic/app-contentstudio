import {ComponentAddedEvent} from './ComponentAddedEvent';
import {Component} from './Component';
import {ComponentPath} from './ComponentPath';

export class ComponentMovedEvent extends ComponentAddedEvent {

    private readonly from: ComponentPath;

    private readonly to: ComponentPath;

    constructor(component: Component, from: ComponentPath, to: ComponentPath, index?: number) {
        super(component, index);

        this.from = from;
        this.to = to;
    }

    getFrom(): ComponentPath {
        return this.from;
    }

    getTo(): ComponentPath {
        return this.to;
    }
}
