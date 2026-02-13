import {type ComponentEventsHolder} from './ComponentEventsHolder';
import {
    type ComponentAddedEventHandler,
    type ComponentRemovedEventHandler,
    type ComponentUpdatedEventHandler
} from '../../page/region/Component';

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
