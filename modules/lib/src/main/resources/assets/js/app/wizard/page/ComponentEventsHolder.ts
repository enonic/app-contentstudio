import {ComponentAddedEvent} from '../../page/region/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../../page/region/ComponentRemovedEvent';

export class ComponentEventsHolder {

    private componentAddedListeners: { (event: ComponentAddedEvent): void }[] = [];

    private componentRemovedListeners: { (event: ComponentRemovedEvent): void }[] = [];

    onComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.componentAddedListeners.push(listener);
    }

    unComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.componentAddedListeners = this.componentAddedListeners.filter(l => l !== listener);
    }

    notifyComponentAdded(event: ComponentAddedEvent) {
        this.componentAddedListeners.forEach(listener => listener(event));
    }

    onComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.componentRemovedListeners.push(listener);
    }

    unComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.componentRemovedListeners = this.componentRemovedListeners.filter(l => l !== listener);
    }

    notifyComponentRemoved(event: ComponentRemovedEvent) {
        this.componentRemovedListeners.forEach(listener => listener(event));
    }
}
