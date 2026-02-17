import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ContentSummary} from '../content/ContentSummary';

export class SaveSortedContentEvent
    extends Event {

    private content: ContentSummary;

    constructor(content: ContentSummary) {
        super();

        this.content = content;
    }

    getContent(): ContentSummary {
        return this.content;
    }

    static on(handler: (event: SaveSortedContentEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SaveSortedContentEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
