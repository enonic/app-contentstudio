import '../api.ts';
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import i18n = api.util.i18n;

export class ContentStatusToolbar
    extends api.app.view.ItemPreviewToolbar<ContentSummaryAndCompareStatus> {
    private status: api.dom.SpanEl;
    private author: api.dom.SpanEl;

    constructor(className?: string) {
        super('content-status-toolbar' + (className ? ' ' + className : ''));

        const invalidMark = new api.dom.DivEl('invalid-mark');
        this.addElement(invalidMark);
        const statusWrapper = new api.dom.DivEl('content-status');
        this.addElement(statusWrapper);

        this.status = new api.dom.SpanEl('status');
        this.author = new api.dom.SpanEl('author');
        statusWrapper.appendChildren(this.status, this.author);
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        if (this.getItem() !== item) {
            super.setItem(item);
            this.toggleClass('invalid', !item.getContentSummary().isValid());
            this.updateStatus(item);
            this.updateAuthor(item);
        }
    }

    private isOnline(content: ContentSummaryAndCompareStatus): boolean {
        return !!content && content.isOnline();
    }

    private updateStatus(content: ContentSummaryAndCompareStatus) {
        this.status.setClass('status');
        if (this.isOnline(content)) {
            this.status.addClass('online');
        }
        this.status.addClass(content.getStatusClass());
        this.status.setHtml(content.getStatusText());
    }

    private updateAuthor(content: ContentSummaryAndCompareStatus) {
        this.author.setHtml(i18n('field.preview.toolbar.status', content.getContentSummary().getModifier()));
    }
}
