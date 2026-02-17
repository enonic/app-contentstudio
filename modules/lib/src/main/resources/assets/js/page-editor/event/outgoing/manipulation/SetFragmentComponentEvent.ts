import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ComponentPath} from '../../../../app/page/region/ComponentPath';

export class SetFragmentComponentEvent
    extends IframeEvent {

    private readonly path: ComponentPath;
    private readonly contentId: string;

    constructor(path: ComponentPath, contentId: string) {
        super();
        this.path = path;
        this.contentId = contentId;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    getContentId(): string {
        return this.contentId;
    }

    static on(handler: (event: SetFragmentComponentEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SetFragmentComponentEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
