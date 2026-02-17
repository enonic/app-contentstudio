import {ComponentAddedEvent} from './ComponentAddedEvent';
import {type Component} from './Component';
import {type Content} from '../../content/Content';

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
