import {Event} from 'lib-admin-ui/event/Event';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class BaseContentModelEvent
    extends Event {

    private model: ContentSummaryAndCompareStatus[];

    constructor(model: ContentSummaryAndCompareStatus[]) {
        super();

        this.model = model;
    }

    getModels(): ContentSummaryAndCompareStatus[] {
        return this.model;
    }
}
