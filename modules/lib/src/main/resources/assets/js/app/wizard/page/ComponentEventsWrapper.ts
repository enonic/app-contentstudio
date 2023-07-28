import {ComponentEventsHolder} from './ComponentEventsHolder';
import {ComponentAddedEvent} from '../../page/region/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../../page/region/ComponentRemovedEvent';

export class ComponentEventsWrapper {

    private readonly componentEvents: ComponentEventsHolder;

    constructor(events: ComponentEventsHolder) {
        this.componentEvents = events;
    }

    onComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.componentEvents.onComponentAdded(listener);
    }

    unComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.componentEvents.unComponentAdded(listener);
    }

    onComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.componentEvents.onComponentRemoved(listener);
    }

    unComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.componentEvents.unComponentRemoved(listener);
    }
}
