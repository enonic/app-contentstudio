import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {ComponentPath} from './ComponentPath';
import {RegionPath} from './RegionPath';

export class ComponentAddedEvent
    extends BaseRegionChangedEvent {

    constructor(componentPath: ComponentPath) {
        super(componentPath);
    }

}
