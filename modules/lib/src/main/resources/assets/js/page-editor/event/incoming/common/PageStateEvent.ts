import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {PageJson} from '../../../../app/page/PageJson';

export class PageStateEvent
    extends Event {

    private readonly pageJson: PageJson;

    constructor(pageJson: PageJson) {
        super();
        this.pageJson = pageJson;
    }

    getPageJson(): PageJson {
        return this.pageJson;
    }

    static on(handler: (event: PageStateEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: PageStateEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
