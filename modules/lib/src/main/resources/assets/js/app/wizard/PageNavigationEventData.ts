import {ComponentPath} from '../page/region/ComponentPath';

export class PageNavigationEventData {

    path?: ComponentPath;

    constructor(path?: ComponentPath) {
        this.path = path;
    }

    getPath(): ComponentPath {
        return this.path;
    }
}
