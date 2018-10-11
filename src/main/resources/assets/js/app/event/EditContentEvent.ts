import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class EditContentEvent
    extends api.event.Event {

    private model: ContentSummaryAndCompareStatus[];

    constructor(model: ContentSummaryAndCompareStatus[]) {
        super();
        this.model = model;
    }

    getModels(): ContentSummaryAndCompareStatus[] {
        return this.model;
    }

    static on(handler: (event: EditContentEvent) => void, contextWindow: Window = window) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: EditContentEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
