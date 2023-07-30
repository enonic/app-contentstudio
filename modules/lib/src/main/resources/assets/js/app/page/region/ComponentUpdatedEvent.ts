import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {ComponentPath} from './ComponentPath';

export class ComponentUpdatedEvent
    extends BaseRegionChangedEvent {

    constructor(componentPath: ComponentPath) {
        super(componentPath);
    }
}
