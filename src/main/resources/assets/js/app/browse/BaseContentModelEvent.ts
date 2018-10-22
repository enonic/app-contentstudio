import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class BaseContentModelEvent extends api.event.Event {

    private model: ContentSummaryAndCompareStatus[];

    constructor(model: ContentSummaryAndCompareStatus[]) {
        super();

        this.model = model;
    }

    getModels(): ContentSummaryAndCompareStatus[] {
        return this.model;
    }
}
