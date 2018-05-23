import '../api.ts';
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import i18n = api.util.i18n;

export class ContentStatusToolbar
    extends api.app.view.ItemPreviewToolbar<ContentSummaryAndCompareStatus> {

    private status: api.dom.SpanEl;
    private author: api.dom.SpanEl;

    constructor(className?: string) {
        super('content-status-toolbar' + (className ? ' ' + className : ''));

        const statusWrapper = new api.dom.DivEl('content-status-wrapper');
        this.addElement(statusWrapper);

        const invalidMark = new api.dom.DivEl('invalid-mark');
        this.status = new api.dom.SpanEl('status');
        this.author = new api.dom.SpanEl('author');
        statusWrapper.appendChildren(invalidMark, this.status, this.author);
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        if (this.getItem() !== item) {
            super.setItem(item);
            this.toggleValid(item.getContentSummary() && item.getContentSummary().isValid());
            this.updateStatus(item);
            this.updateAuthor(item);
        }
    }

    toggleValid(valid: boolean) {
        this.toggleClass('invalid', !valid);
    }

    private isOnline(content: ContentSummaryAndCompareStatus): boolean {
        return !!content && content.isOnline();
    }

    private updateStatus(content: ContentSummaryAndCompareStatus) {
        this.status.setClass('status');
        if (this.isOnline(content)) {
            this.status.addClass('online');
        }
        if (content) {
            this.status.addClass(content.getStatusClass());
            this.status.setHtml(content.getStatusText());
        }
    }

    private updateAuthor(content: ContentSummaryAndCompareStatus) {
        let text = '';
        if (content && content.getContentSummary()) {
            const name = content.getContentSummary().getModifier();
            text = i18n('field.preview.toolbar.status', api.security.PrincipalKey.fromString(name).getId());
        }
        this.author.setHtml(text);
    }
}
