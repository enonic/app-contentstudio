import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {ComponentPath} from './ComponentPath';
import {RegionPath} from './RegionPath';

export class ComponentRemovedEvent
    extends BaseRegionChangedEvent {

    constructor(componentPath: ComponentPath) {
        super(componentPath);
    }
}
