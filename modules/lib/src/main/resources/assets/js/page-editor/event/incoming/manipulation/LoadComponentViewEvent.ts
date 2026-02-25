import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ComponentPath} from '../../../../app/page/region/ComponentPath';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class LoadComponentViewEvent
    extends IframeEvent {

    private readonly path: ComponentPath;

    private readonly existing: boolean;

    constructor(path?: ComponentPath, existing: boolean = false) {
        super();
        this.path = path;
        this.existing = existing;
    }

    getComponentPath(): ComponentPath {
        return this.path;
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
