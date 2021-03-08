import {ContentItemStatisticsPanel} from '../view/ContentItemStatisticsPanel';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {BrowseItemPanel} from 'lib-admin-ui/app/browse/BrowseItemPanel';

export class ContentBrowseItemPanel
    extends BrowseItemPanel {

    constructor() {
        super();

        this.addClass('content-browse-item-panel');
    }

    createItemStatisticsPanel(): ContentItemStatisticsPanel {
        return new ContentItemStatisticsPanel();
    }

    setStatisticsItem(item: ContentSummaryAndCompareStatus): void {
        super.setStatisticsItem(!!item ? item.clone() : item);
    }
}
