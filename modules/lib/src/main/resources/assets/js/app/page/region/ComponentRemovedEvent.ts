import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {type ComponentPath} from './ComponentPath';

export class ComponentRemovedEvent
    extends BaseRegionChangedEvent {

    constructor(componentPath: ComponentPath) {
        super(componentPath);
    }
}
