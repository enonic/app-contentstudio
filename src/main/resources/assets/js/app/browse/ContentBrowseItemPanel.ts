import {ContentItemStatisticsPanel} from '../view/ContentItemStatisticsPanel';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class ContentBrowseItemPanel
    extends api.app.browse.BrowseItemPanel<ContentSummaryAndCompareStatus> {

    constructor() {
        super();

        this.addClass('content-browse-item-panel');
    }

    createItemStatisticsPanel(): ContentItemStatisticsPanel {
        return new ContentItemStatisticsPanel();
    }

}
