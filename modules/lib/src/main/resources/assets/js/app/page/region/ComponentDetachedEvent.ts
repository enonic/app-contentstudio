import {ComponentAddedEvent} from './ComponentAddedEvent';
import {type Component} from './Component';

export class ComponentDetachedEvent extends ComponentAddedEvent {

    private readonly name: string;

    constructor(component: Component, name: string, index?: number) {
        super(component, index);

        this.name = name;
    }

    getName(): string {
        return this.name;
    }
}
