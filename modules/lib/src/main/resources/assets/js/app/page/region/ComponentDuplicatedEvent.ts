import {ComponentAddedEvent} from './ComponentAddedEvent';
import {type Component} from './Component';

export class ComponentDuplicatedEvent extends ComponentAddedEvent {

    constructor(component: Component, index?: number) {
        super(component, index);
    }

}
