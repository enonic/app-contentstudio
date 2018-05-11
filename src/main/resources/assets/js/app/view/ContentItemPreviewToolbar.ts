import '../../api.ts';
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;

export class ContentItemPreviewToolbar
    extends api.app.view.ItemPreviewToolbar<ContentSummaryAndCompareStatus> {

    constructor() {
        super('content-item-preview-toolbar');
    }

    setItem(item: api.app.view.ViewItem<ContentSummaryAndCompareStatus>) {
        if (this.getItem() !== item) {
            super.setItem(item);
        }
    }
}
