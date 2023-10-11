import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {ItemPreviewToolbar} from '@enonic/lib-admin-ui/app/view/ItemPreviewToolbar';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import * as Q from 'q';
import {CompareWithPublishedVersionDialog} from './dialog/CompareWithPublishedVersionDialog';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';

export interface ContentStatusToolbarConfig {
    className?: string;
}

export class ContentStatusToolbar
    extends ItemPreviewToolbar<ContentSummaryAndCompareStatus> {

    private showChangesBtn: ButtonEl;

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

        this.showChangesBtn = new ButtonEl();
        this.showChangesBtn.setClass('show-changes').setTitle(i18n('text.versions.showChanges'));
        this.showChangesBtn.onClicked(() => this.openShowPublishedVersionChangesDialog());
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

        const allowShowChanges = content.isModified() || content.isMoved();
        this.showChangesBtn.setEnabled(allowShowChanges).setVisible(allowShowChanges);
    }

    clearItem(): void {
        super.setItem(null);
        this.clearStatus();
    }

    private clearStatus(): void {
        this.status.setHtml('');
        this.showChangesBtn.setEnabled(false).hide();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            const statusWrapper = new DivEl('content-status-wrapper');
            this.addElement(statusWrapper);
            statusWrapper.appendChildren(this.status, this.showChangesBtn);

            return rendered;
        });
    }

    protected openShowPublishedVersionChangesDialog() {
        CompareWithPublishedVersionDialog.get()
            .setContent(this.getItem())
            .open();
    }
}
