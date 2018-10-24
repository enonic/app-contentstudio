import {RegionPath} from './RegionPath';

export class BaseRegionChangedEvent {

    private path: RegionPath;

    constructor(path: RegionPath) {
        this.path = path;
    }

    public getPath(): RegionPath {
        return this.path;
    }
}
