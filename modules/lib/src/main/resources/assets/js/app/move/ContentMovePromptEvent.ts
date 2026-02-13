import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {type ContentSummary} from '../content/ContentSummary';

export class ContentMovePromptEvent
    extends Event {

    private readonly content: ContentSummary[];

    constructor(content: ContentSummary[]) {
        super();
        this.content = content;
    }

    getContentSummaries(): ContentSummary[] {
        return this.content;
    }

    static on(handler: (event: ContentMovePromptEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ContentMovePromptEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
