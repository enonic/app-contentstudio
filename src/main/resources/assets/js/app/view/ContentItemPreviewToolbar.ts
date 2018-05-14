import '../../api.ts';
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import ViewItem = api.app.view.ViewItem;
import i18n = api.util.i18n;

export class ContentItemPreviewToolbar
    extends api.app.view.ItemPreviewToolbar<ContentSummaryAndCompareStatus> {
    private status: api.dom.SpanEl;

    constructor() {
        super('content-item-preview-toolbar');
        const invalidMark = new api.dom.DivEl('invalid-mark');
        this.addElement(invalidMark);
        this.status = new api.dom.DivEl('content-status');
        this.addElement(this.status);
    }

    setItem(item: ViewItem<ContentSummaryAndCompareStatus>) {
        if (this.getItem() !== item) {
            super.setItem(item);
            const model = item.getModel();
            this.toggleClass('invalid', !model.getContentSummary().isValid());
            this.status.setHtml(this.getStatusString(model), false);
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
