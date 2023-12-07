import {ComponentPath} from '../page/region/ComponentPath';

export enum PageNavigationEventSource {
    EDITOR, FORM
}

export class PageNavigationEventData {

    private readonly path?: ComponentPath;

    private readonly source?: PageNavigationEventSource;

    constructor(path?: ComponentPath, source?: PageNavigationEventSource) {
        this.path = path;
        this.source = source;
    }

    getPath(): ComponentPath {
        return this.path;
    }

    getSource(): PageNavigationEventSource {
        return this.source;
    }
}
