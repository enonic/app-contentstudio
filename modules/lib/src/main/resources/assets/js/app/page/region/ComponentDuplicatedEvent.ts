import {ComponentAddedEvent} from './ComponentAddedEvent';
import {Component} from './Component';

export class ComponentDuplicatedEvent extends ComponentAddedEvent {

    constructor(component: Component, index?: number) {
        super(component, index);
    }

}
