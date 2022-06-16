import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {ItemPreviewToolbar} from '@enonic/lib-admin-ui/app/view/ItemPreviewToolbar';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import * as Q from 'q';
import {GetPrincipalByKeyRequest} from './resource/GetPrincipalByKeyRequest';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export interface ContentStatusToolbarConfig {
    className?: string;
}

export class ContentStatusToolbar
    extends ItemPreviewToolbar<ContentSummaryAndCompareStatus> {

    protected status: SpanEl;

    protected config: ContentStatusToolbarConfig;

    constructor(config: ContentStatusToolbarConfig) {
        super('content-status-toolbar' + (config.className ? ' ' + config.className : ''));

        this.config = config;

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.status = new SpanEl('status');
    }

    protected initListeners(): void {
        //
    }

    setItem(item: ContentSummaryAndCompareStatus): void {
        if (item && !item.equals(this.getItem())) {
            const content: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus
                .fromContentAndCompareStatus(item.getContentSummary(), item.getCompareStatus())
                .setPublishStatus(item.getPublishStatus())
                .setRenderable(item.isRenderable());
            const isValid: boolean = content.getContentSummary() && content.getContentSummary().isValid();
            super.setItem(content);
            this.toggleValid(isValid);
            this.updateStatus(content);
        }
    }

    toggleValid(valid: boolean): void {
        this.toggleClass('invalid', !valid);
    }

    private updateStatus(content: ContentSummaryAndCompareStatus): void {
        this.status.setClass('status');

        if (content) {
            this.status.addClass(content.getStatusClass());
            this.status.setHtml(content.getStatusText());
        }
    }

    clearItem(): void {
        super.setItem(null);
        this.clearStatus();
    }

    private clearStatus(): void {
        this.status.setHtml('');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            const statusWrapper: DivEl = new DivEl('content-status-wrapper');
            this.addElement(statusWrapper);
            statusWrapper.appendChildren(this.status);

            return rendered;
        });
    }
}
