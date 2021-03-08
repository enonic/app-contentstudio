import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {GetPrincipalByKeyRequest} from './resource/GetPrincipalByKeyRequest';
import {ItemPreviewToolbar} from 'lib-admin-ui/app/view/ItemPreviewToolbar';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Principal} from 'lib-admin-ui/security/Principal';

export class ContentStatusToolbar
    extends ItemPreviewToolbar<ContentSummaryAndCompareStatus> {

    protected status: SpanEl;
    protected author: SpanEl;

    constructor(className?: string) {
        super('content-status-toolbar' + (className ? ' ' + className : ''));

        const statusWrapper = new DivEl('content-status-wrapper');
        this.addElement(statusWrapper);

        this.status = new SpanEl('status');
        this.author = new SpanEl('author');
        statusWrapper.appendChildren(this.status, this.author);
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        if (item && !item.equals(this.getItem())) {
            const content = ContentSummaryAndCompareStatus
                .fromContentAndCompareStatus(item.getContentSummary(), item.getCompareStatus())
                .setPublishStatus(item.getPublishStatus())
                .setRenderable(item.isRenderable());
            const isValid = content.getContentSummary() && content.getContentSummary().isValid();
            super.setItem(content);
            this.toggleValid(isValid);
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
        if (content) {
            this.status.addClass(content.getStatusClass());
            this.status.setHtml(content.getStatusText());
        }
    }

    clearItem() {
        super.setItem(null);
        this.clearStatus();
        this.clearAuthor();
    }

    private clearStatus() {
        this.status.setHtml('');
    }

    private clearAuthor() {
        this.author.setHtml('');
    }

    private updateAuthor(content: ContentSummaryAndCompareStatus) {
        if (content && content.getContentSummary()) {
            const name = content.getContentSummary().getModifier();
            new GetPrincipalByKeyRequest(PrincipalKey.fromString(name)).sendAndParse()
                .then((user: Principal) => {
                    this.author.setHtml(i18n('field.preview.toolbar.status', user.getDisplayName()));
                }).catch(() => {
                    this.author.setHtml(name);
                });
        } else {
            this.clearAuthor();
        }
    }
}
