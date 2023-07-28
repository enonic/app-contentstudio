import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../app/page/region/ComponentPath';

export class LoadComponentRequested
    extends Event {

    private readonly path: ComponentPath;

    private readonly uri: string;
    constructor(path: ComponentPath, uri: string) {
        super();
        this.path = path;
        this.uri = uri;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    getURI(): string {
        return this.uri;
    }

    static on(handler: (event: LoadComponentRequested) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LoadComponentRequested) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
