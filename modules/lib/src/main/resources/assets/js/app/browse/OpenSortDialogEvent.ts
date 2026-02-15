import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class OpenSortDialogEvent
    extends Event {
    private content: ContentSummaryAndCompareStatus;

    constructor(content: ContentSummaryAndCompareStatus) {
        super();
        this.content = content;
    }

    getContent(): ContentSummaryAndCompareStatus {
        return this.content;
    }

    static on(handler: (event: OpenSortDialogEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: OpenSortDialogEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
