import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {ItemPreviewToolbar} from '@enonic/lib-admin-ui/app/view/ItemPreviewToolbar';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import * as Q from 'q';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {ShowPublishedVersionChangesDialog} from './dialog/ShowPublishedVersionChangesDialog';

export interface ContentStatusToolbarConfig {
    className?: string;
}

export class ContentStatusToolbar
    extends ItemPreviewToolbar<ContentSummaryAndCompareStatus> {

    protected status: SpanEl;

    private showChangesLink: AEl;

    protected config: ContentStatusToolbarConfig;

    constructor(config: ContentStatusToolbarConfig) {
        super('content-status-toolbar' + (config.className ? ' ' + config.className : ''));

        this.config = config;

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.status = new SpanEl('status');
        this.createShowChangesLink();
    }

    private createShowChangesLink() {
        this.showChangesLink = new AEl('show-changes');
        this.showChangesLink.setHtml('Show changes');
        this.showChangesLink.onClicked(() => this.openShowPublishedVersionChangesDialog());
        this.showChangesLink.hide();
    }

    protected initListeners(): void {
        //
    }

    setItem(item: ContentSummaryAndCompareStatus): void {
        if (item && !item.equals(this.getItem())) {
            const content = item.clone();
            const isValid: boolean = content?.getContentSummary()?.isValid();
            super.setItem(content);
            this.toggleValid(isValid);
            this.updateStatus(content);
        }
    }

    protected shouldShowChangesLink(item: ContentSummaryAndCompareStatus) {
        return item.isModified();
    }

    toggleValid(valid: boolean): void {
        this.toggleClass('invalid', !valid);
    }

    protected updateStatus(content: ContentSummaryAndCompareStatus): void {
        this.status.setClass('status');

        if (content) {
            this.status.addClass(content.getStatusClass());
            this.status.setHtml(content.getStatusText());
        }

        this.showChangesLink.setVisible(this.shouldShowChangesLink(content));
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
            statusWrapper.appendChildren(this.status, this.showChangesLink);

            return rendered;
        });
    }

    private openShowPublishedVersionChangesDialog() {
        ShowPublishedVersionChangesDialog.get()
            .setContent(this.getItem())
            .open();
    }
}
