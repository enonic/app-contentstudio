import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {ComponentPath} from './ComponentPath';
import {RegionPath} from './RegionPath';
import {ComponentType} from './ComponentType';
import {Component} from './Component';

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
