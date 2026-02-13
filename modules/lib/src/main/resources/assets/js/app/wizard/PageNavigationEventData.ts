import {type ComponentPath} from '../page/region/ComponentPath';

export enum PageNavigationEventSource {
    EDITOR, FORM
}

export class PageNavigationEventData {

    private readonly path?: ComponentPath;

    private readonly source?: PageNavigationEventSource;

    private readonly focus?: boolean;

    constructor(path?: ComponentPath, source?: PageNavigationEventSource, focus?: boolean) {
        this.path = path;
        this.source = source;
        this.focus = focus;
    }

    getPath(): ComponentPath {
        return this.path;
    }

    getSource(): PageNavigationEventSource {
        return this.source;
    }

    isFocus(): boolean {
        return this.focus;
    }
}
