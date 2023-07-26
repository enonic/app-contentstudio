import {Component, ComponentAddedEventHandler} from './Component';
import {ComponentAddedEvent} from './ComponentAddedEvent';

export class ComponentEventsHandler {

    private componentAddedListeners: ComponentAddedEventHandler[] = [];

    onComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.componentAddedListeners.push(listener);
    }

    unComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.componentAddedListeners =
            this.componentAddedListeners.filter((curr: (event: ComponentAddedEvent) => void) => {
                return listener !== curr;
            });
    }

    notifyComponentAdded(component: Component) {
        const event: ComponentAddedEvent = new ComponentAddedEvent(component);
        this.componentAddedListeners.forEach((listener: (event: ComponentAddedEvent) => void) => {
            listener(event);
        });
    }

    notifyComponentAddedEvent(event: ComponentAddedEvent) {
        this.componentAddedListeners.forEach((listener: (event: ComponentAddedEvent) => void) => {
            listener(event);
        });
    }
}
