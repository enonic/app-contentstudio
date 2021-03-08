import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {ComponentPath} from './ComponentPath';
import {RegionPath} from './RegionPath';

export class ComponentAddedEvent
    extends BaseRegionChangedEvent {

    private componentPath: ComponentPath;

    constructor(regionPath: RegionPath, componentPath: ComponentPath) {
        super(regionPath);
        this.componentPath = componentPath;
    }

    getComponentPath(): ComponentPath {
        return this.componentPath;
    }
}
