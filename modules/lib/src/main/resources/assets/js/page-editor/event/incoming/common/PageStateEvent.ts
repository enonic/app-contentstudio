import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import type {PageJson} from '../../../../app/page/PageJson';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class PageStateEvent
    extends IframeEvent {

    private readonly pageJson: PageJson;

    constructor(pageJson: PageJson) {
        super();
        this.pageJson = pageJson;
    }

    getPageJson(): PageJson {
        return this.pageJson;
    }

    static on(handler: (event: PageStateEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: PageStateEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
