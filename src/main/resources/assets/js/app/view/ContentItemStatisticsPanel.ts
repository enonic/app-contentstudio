import '../../api.ts';
import {ContentItemPreviewPanel} from './ContentItemPreviewPanel';
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;

export class ContentItemStatisticsPanel
    extends api.app.view.ItemStatisticsPanel<ContentSummaryAndCompareStatus> {

    private previewPanel: ContentItemPreviewPanel;

    constructor() {
        super('content-item-statistics-panel');

        this.previewPanel = new ContentItemPreviewPanel();
        this.previewPanel.setDoOffset(false);
        this.appendChild(this.previewPanel);
    }

    setItem(item: api.app.view.ViewItem<ContentSummaryAndCompareStatus>) {
        if (this.getItem() !== item) {
            super.setItem(item);
            this.previewPanel.setItem(item);
        }
    }

    getPreviewPanel(): ContentItemPreviewPanel {
        return this.previewPanel;
    }
}
