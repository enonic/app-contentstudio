import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {ItemPreviewToolbar} from '@enonic/lib-admin-ui/app/view/ItemPreviewToolbar';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import * as Q from 'q';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {CompareWithPublishedVersionDialog} from './dialog/CompareWithPublishedVersionDialog';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export interface ContentStatusToolbarConfig {
    className?: string;
}

export class ContentStatusToolbar
    extends ItemPreviewToolbar<ContentSummaryAndCompareStatus> {

    protected status: SpanEl;

    protected compareVersionsLink: AEl;

    protected config: ContentStatusToolbarConfig;

    constructor(config: ContentStatusToolbarConfig) {
        super('content-status-toolbar' + (config.className ? ' ' + config.className : ''));

        this.config = config;

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.status = new SpanEl('status');
        this.compareVersionsLink = this.createCompareVersionsLink();
    }

    private createCompareVersionsLink() {
        const compareVersionsLink = new AEl('show-changes');
        compareVersionsLink.setHtml(i18n('text.versions.showChanges'));
        compareVersionsLink.onClicked(() => this.openShowPublishedVersionChangesDialog());
        compareVersionsLink.hide();

        return compareVersionsLink;
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

    toggleValid(valid: boolean): void {
        this.toggleClass('invalid', !valid);
    }

    protected updateStatus(content: ContentSummaryAndCompareStatus): void {
        this.status.setClass('status');

        if (content) {
            this.status.addClass(content.getStatusClass());
            this.status.setHtml(content.getStatusText());
        }

        this.compareVersionsLink.setVisible(content.isModified());
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
            statusWrapper.appendChildren(this.status, this.compareVersionsLink);

            return rendered;
        });
    }

    protected openShowPublishedVersionChangesDialog() {
        CompareWithPublishedVersionDialog.get()
            .setContent(this.getItem())
            .open();
    }
}
