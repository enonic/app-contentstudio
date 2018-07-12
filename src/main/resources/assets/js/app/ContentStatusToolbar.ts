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

        this.status = new api.dom.SpanEl('status');
        this.author = new api.dom.SpanEl('author');
        statusWrapper.appendChildren(this.status, this.author);
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        if (item && !item.equals(this.getItem())) {
            const content = ContentSummaryAndCompareStatus
                .fromContentAndCompareStatus(item.getContentSummary(), item.getCompareStatus())
                .setPublishStatus(item.getPublishStatus());
            super.setItem(content);
            this.toggleValid(content.getContentSummary() && content.getContentSummary().isValid());
            this.updateStatus(content);
            this.updateAuthor(content);
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
        if (content && content.getContentSummary()) {
            const name = content.getContentSummary().getModifier();
            new api.security.GetPrincipalByKeyRequest(api.security.PrincipalKey.fromString(name)).sendAndParse()
                .then((user: api.security.Principal) => {
                    this.author.setHtml(i18n('field.preview.toolbar.status', user.getDisplayName()));
                })
                .catch(reason => {
                    this.author.setHtml(name);
                });
        } else {
            this.author.setHtml('');
        }
    }
}
