import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';

export class OpenDuplicateDialogEvent
    extends Event {
    private content: ContentSummary[];

    constructor(content: ContentSummary[]) {
        super();
        this.content = content;
    }

    getContentSummaries(): ContentSummary[] {
        return this.content;
    }

    static on(handler: (event: OpenDuplicateDialogEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: OpenDuplicateDialogEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
