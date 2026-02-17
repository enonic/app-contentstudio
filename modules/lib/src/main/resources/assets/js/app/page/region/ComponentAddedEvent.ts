import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {type ComponentPath} from './ComponentPath';
import {type Component} from './Component';

export class ComponentAddedEvent
    extends BaseRegionChangedEvent {

    private readonly component: Component;

    private readonly index?: number;

    constructor(component: Component, index?: number) {
        super(component.getPath());

        this.component = component;
        this.index = index;
    }

    getPath(): ComponentPath {
        return this.component.getPath();
    }

    getComponent(): Component {
        return this.component;
    }

    getIndex(): number | undefined {
        return this.index;
    }
}
