import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ContentId} from '../content/ContentId';

export class SearchAndExpandItemEvent
    extends Event {

    private readonly item: ContentId;

    constructor(id: ContentId) {
        super();
        this.item = id;
    }

    getContentId(): ContentId {
        return this.item;
    }

    static on(handler: (event: SearchAndExpandItemEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SearchAndExpandItemEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
