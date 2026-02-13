import {RegionsChangedEvent} from './RegionsChangedEvent';
import {type ComponentPath} from './ComponentPath';

export class RegionRemovedEvent
    extends RegionsChangedEvent {

    private regionPath: ComponentPath;

    constructor(regionPath: ComponentPath) {
        super();
        this.regionPath = regionPath;
    }

    getRegionPath(): ComponentPath {
        return this.regionPath;
    }
}
