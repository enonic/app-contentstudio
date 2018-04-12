import '../../api.ts';
import ContentSummary = api.content.ContentSummary;

export class OpenDuplicateDialogEvent
    extends api.event.Event {
    private content: ContentSummary[];

    constructor(content: ContentSummary[]) {
        super();
        this.content = content;
    }

    getContentSummaries(): ContentSummary[] {
        return this.content;
    }

    static on(handler: (event: OpenDuplicateDialogEvent) => void, contextWindow: Window = window) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: OpenDuplicateDialogEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
