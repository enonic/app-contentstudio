import {type ComponentPath} from './ComponentPath';

export class BaseRegionChangedEvent {

    private readonly path: ComponentPath;

    constructor(path: ComponentPath) {
        this.path = path;
    }

    public getPath(): ComponentPath {
        return this.path;
    }
}
