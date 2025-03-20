import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';

export class LoadComponentViewEvent
    extends Event {

    private readonly path: ComponentPath;

    private readonly uri: string;

    private readonly existing: boolean;

    constructor(path: ComponentPath, uri: string, existing: boolean = false) {
        super();
        this.path = path;
        this.uri = uri;
        this.existing = existing;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    getURI(): string {
        return this.uri;
    }

    isExisting(): boolean {
        return this.existing;
    }

    static on(handler: (event: LoadComponentViewEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LoadComponentViewEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
