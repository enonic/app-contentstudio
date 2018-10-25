import {ComponentPath} from './ComponentPath';

export class ComponentChangedEvent {

    private path: ComponentPath;

    constructor(path: ComponentPath) {
        this.path = path;
    }

    public getPath(): ComponentPath {
        return this.path;
    }
}
