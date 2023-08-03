import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';

export class ReloadFragmentViewEvent
    extends Event {

    private readonly path: ComponentPath;

    private readonly contentId: string;

    constructor(path: ComponentPath, contentId: string) {
        super();
        this.path = path;
        this.contentId = contentId;
    }

    getPath(): ComponentPath {
        return this.path;
    }

    getContentId(): string {
        return this.contentId;
    }

    static on(handler: (event: ReloadFragmentViewEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ReloadFragmentViewEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
