import {RegionsChangedEvent} from './RegionsChangedEvent';
import {RegionPath} from './RegionPath';
import {ComponentPath} from './ComponentPath';

export class RegionAddedEvent
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
