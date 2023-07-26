import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {ComponentPath} from './ComponentPath';
import {RegionPath} from './RegionPath';
import {ComponentType} from './ComponentType';
import {Component} from './Component';

export class ComponentAddedEvent
    extends BaseRegionChangedEvent {

    private readonly component: Component;
    constructor(component: Component) {
        super(component.getPath());

        this.component = component;
    }

    getComponent(): Component {
        return this.component;
    }

}
