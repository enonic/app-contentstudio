import {ComponentEventsHolder} from './ComponentEventsHolder';
import {ComponentAddedEvent} from '../../page/region/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../../page/region/ComponentRemovedEvent';
import {ComponentUpdatedEvent} from '../../page/region/ComponentUpdatedEvent';

export class ComponentEventsWrapper {

    protected readonly eventsHolder: ComponentEventsHolder;

    constructor(events: ComponentEventsHolder) {
        this.eventsHolder = events;
    }

    onComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.eventsHolder.onComponentAdded(listener);
    }

    unComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.eventsHolder.unComponentAdded(listener);
    }

    onComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.eventsHolder.onComponentRemoved(listener);
    }

    unComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.eventsHolder.unComponentRemoved(listener);
    }

    onComponentUpdated(listener: (event: ComponentUpdatedEvent) => void) {
        this.eventsHolder.onComponentUpdated(listener);
    }

    unComponentUpdated(listener: (event: ComponentUpdatedEvent) => void) {
        this.eventsHolder.unComponentUpdated(listener);
    }
}
