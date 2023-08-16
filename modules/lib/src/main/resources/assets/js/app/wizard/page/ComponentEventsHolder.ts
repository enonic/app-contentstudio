import {ComponentAddedEvent} from '../../page/region/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../../page/region/ComponentRemovedEvent';
import {ComponentUpdatedEvent} from '../../page/region/ComponentUpdatedEvent';
import {ComponentAddedEventHandler, ComponentRemovedEventHandler, ComponentUpdatedEventHandler} from '../../page/region/Component';

export class ComponentEventsHolder {

    private componentAddedListeners: ComponentAddedEventHandler[] = [];

    private componentRemovedListeners: ComponentRemovedEventHandler[] = [];

    private componentUpdatedListeners: ComponentUpdatedEventHandler[] = [];

    onComponentAdded(listener: ComponentAddedEventHandler) {
        this.componentAddedListeners.push(listener);
    }

    unComponentAdded(listener: ComponentAddedEventHandler) {
        this.componentAddedListeners = this.componentAddedListeners.filter(l => l !== listener);
    }

    notifyComponentAdded(event: ComponentAddedEvent) {
        this.componentAddedListeners.forEach(listener => listener(event));
    }

    onComponentRemoved(listener: ComponentRemovedEventHandler) {
        this.componentRemovedListeners.push(listener);
    }

    unComponentRemoved(listener: ComponentRemovedEventHandler) {
        this.componentRemovedListeners = this.componentRemovedListeners.filter(l => l !== listener);
    }

    notifyComponentRemoved(event: ComponentRemovedEvent) {
        this.componentRemovedListeners.forEach(listener => listener(event));
    }

    onComponentUpdated(listener: ComponentUpdatedEventHandler) {
        this.componentUpdatedListeners.push(listener);
    }

    unComponentUpdated(listener: ComponentUpdatedEventHandler) {
        this.componentUpdatedListeners = this.componentUpdatedListeners.filter(l => l !== listener);
    }

    notifyComponentUpdated(event: ComponentUpdatedEvent) {
        this.componentUpdatedListeners.forEach(listener => listener(event));
    }

}
