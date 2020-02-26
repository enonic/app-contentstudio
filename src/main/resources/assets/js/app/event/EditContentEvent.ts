import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class EditContentEvent
    extends Event {

    private model: ContentSummaryAndCompareStatus[];

    constructor(model: ContentSummaryAndCompareStatus[]) {
        super();
        this.model = model;
    }

    getModels(): ContentSummaryAndCompareStatus[] {
        return this.model;
    }

    static on(handler: (event: EditContentEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: EditContentEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
