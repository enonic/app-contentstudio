import {ComponentAddedEvent} from './ComponentAddedEvent';
import {Component} from './Component';
import {Content} from '../../content/Content';

export class ComponentFragmentCreatedEvent extends ComponentAddedEvent {

    private readonly fragmentContent: Content;

    constructor(component: Component, fragmentContent: Content, index?: number) {
        super(component, index);

        this.fragmentContent = fragmentContent;
    }

    getFragmentContent(): Content {
        return this.fragmentContent;
    }

}
