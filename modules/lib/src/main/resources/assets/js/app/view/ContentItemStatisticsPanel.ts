import {ContentItemPreviewPanel} from './ContentItemPreviewPanel';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ItemStatisticsPanel} from '@enonic/lib-admin-ui/app/view/ItemStatisticsPanel';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class ContentItemStatisticsPanel
    extends ItemStatisticsPanel {

    private readonly previewPanel: ContentItemPreviewPanel;

    constructor() {
        super('content-item-statistics-panel');

        this.previewPanel = new ContentItemPreviewPanel();
        this.previewPanel.setDoOffset(false);
        this.appendChild(this.previewPanel);
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        if (!ObjectHelper.equals(this.getItem(), item)) {
            super.setItem(item);
            this.previewPanel.setItem(item);
        }
    }

    clearItem() {
        super.clearItem();

        this.previewPanel.clearItem();
    }

    getPreviewPanel(): ContentItemPreviewPanel {
        return this.previewPanel;
    }
}
