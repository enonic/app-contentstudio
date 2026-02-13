import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {type ComponentPath} from './ComponentPath';

export class ComponentUpdatedEvent
    extends BaseRegionChangedEvent {

    constructor(componentPath: ComponentPath) {
        super(componentPath);
    }
}
