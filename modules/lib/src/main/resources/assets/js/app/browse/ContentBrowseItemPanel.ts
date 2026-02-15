import {ContentItemStatisticsPanel} from '../view/ContentItemStatisticsPanel';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {BrowseItemPanel} from '@enonic/lib-admin-ui/app/browse/BrowseItemPanel';

export class ContentBrowseItemPanel
    extends BrowseItemPanel {

    constructor() {
        super();

        this.addClass('content-browse-item-panel');
    }

    createItemStatisticsPanel(): ContentItemStatisticsPanel {
        return new ContentItemStatisticsPanel();
    }

    setStatisticsItem(item?: ContentSummaryAndCompareStatus): void {
        const itemToSet = item?.hasContentSummary() ? item.clone() : undefined;
        super.setStatisticsItem(itemToSet);
    }

    getItemStatisticsPanel(): ContentItemStatisticsPanel {
        return this.itemStatisticsPanel as ContentItemStatisticsPanel;
    }
}
