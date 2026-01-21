import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class LoadComponentViewEvent
    extends IframeEvent {

    private readonly path: ComponentPath;

    private readonly uri: string;

    private readonly existing: boolean;

    constructor(path?: ComponentPath, uri?: string, existing: boolean = false) {
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
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LoadComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
