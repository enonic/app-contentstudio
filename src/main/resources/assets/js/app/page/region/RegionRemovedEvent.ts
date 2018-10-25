import {RegionsChangedEvent} from './RegionsChangedEvent';
import {RegionPath} from './RegionPath';

export class RegionRemovedEvent
    extends RegionsChangedEvent {

    private regionPath: RegionPath;

    constructor(regionPath: RegionPath) {
        super();
        this.regionPath = regionPath;
    }

    getRegionPath(): RegionPath {
        return this.regionPath;
    }
}
