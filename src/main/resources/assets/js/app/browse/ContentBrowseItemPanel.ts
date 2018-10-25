import {ContentItemStatisticsPanel} from '../view/ContentItemStatisticsPanel';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class ContentBrowseItemPanel
    extends api.app.browse.BrowseItemPanel<ContentSummaryAndCompareStatus> {

    createItemStatisticsPanel(): ContentItemStatisticsPanel {
        return new ContentItemStatisticsPanel();
    }

}
