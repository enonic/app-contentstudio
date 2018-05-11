import '../../api.ts';
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import ViewItem = api.app.view.ViewItem;
import i18n = api.util.i18n;

export class ContentItemPreviewToolbar
    extends api.app.view.ItemPreviewToolbar<ContentSummaryAndCompareStatus> {
    private status: api.dom.SpanEl;

    constructor() {
        super('content-item-preview-toolbar');
        this.status = new api.dom.SpanEl('content-status');
        this.addElement(this.status);
    }

    setItem(item: ViewItem<ContentSummaryAndCompareStatus>) {
        if (this.getItem() !== item) {
            super.setItem(item);
            this.status.setHtml(this.getStatusString(item.getModel()), false);
        }
    }

    private isOnline(content: ContentSummaryAndCompareStatus): boolean {
        return !!content && content.isOnline();
    }

    private getStatusString(content: ContentSummaryAndCompareStatus): string {

        let status = new api.dom.SpanEl();
        if (this.isOnline(content)) {
            status.addClass('online');
        }

        status.addClass(content.getStatusClass());
        status.setHtml(content.getStatusText());

        return i18n('field.preview.toolbar.status', status.toString(), content.getContentSummary().getModifier());
    }
}
