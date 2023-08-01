import {ComponentEventsHolder} from './ComponentEventsHolder';
import {ComponentAddedEvent} from '../../page/region/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../../page/region/ComponentRemovedEvent';
import {ComponentUpdatedEvent} from '../../page/region/ComponentUpdatedEvent';
import {ComponentAddedEventHandler, ComponentRemovedEventHandler, ComponentUpdatedEventHandler} from '../../page/region/Component';

export class ComponentEventsWrapper {

    protected readonly eventsHolder: ComponentEventsHolder;

    constructor(events: ComponentEventsHolder) {
        this.eventsHolder = events;
    }

    onComponentAdded(listener: ComponentAddedEventHandler) {
        this.eventsHolder.onComponentAdded(listener);
    }

    unComponentAdded(listener: ComponentAddedEventHandler) {
        this.eventsHolder.unComponentAdded(listener);
    }

    onComponentRemoved(listener: ComponentRemovedEventHandler) {
        this.eventsHolder.onComponentRemoved(listener);
    }

    unComponentRemoved(listener: ComponentRemovedEventHandler) {
        this.eventsHolder.unComponentRemoved(listener);
    }

    onComponentUpdated(listener: ComponentUpdatedEventHandler) {
        this.eventsHolder.onComponentUpdated(listener);
    }

    unComponentUpdated(listener: ComponentUpdatedEventHandler) {
        this.eventsHolder.unComponentUpdated(listener);
    }
}
