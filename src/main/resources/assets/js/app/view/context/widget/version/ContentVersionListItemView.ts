import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {ContentVersionViewer} from './ContentVersionViewer';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../../../../ContentVersion';
import {PublishStatus, PublishStatusFormatter} from '../../../../publish/PublishStatus';
import {CompareStatus, CompareStatusFormatter} from '../../../../content/CompareStatus';
import {CompareContentVersionsDialog} from '../../../../dialog/CompareContentVersionsDialog';
import {RevertVersionRequest} from '../../../../resource/RevertVersionRequest';
import {ActiveContentVersionSetEvent} from '../../../../event/ActiveContentVersionSetEvent';
import * as $ from 'jquery';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Action} from 'lib-admin-ui/ui/Action';
import {Tooltip} from 'lib-admin-ui/ui/Tooltip';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {VersionInfoBlock} from './VersionInfoBlock';

export class ContentVersionListItemView
    extends LiEl {

    private version: ContentVersion;
    private content: ContentSummaryAndCompareStatus;
    private tooltip: Tooltip;

    private statusBlock: DivEl;
    private descriptionBlock: ContentVersionViewer;
    private versionInfoBlock: VersionInfoBlock;

    private revertButton: ActionButton;
    private compareButton: ActionButton;

    constructor(version: ContentVersion, content: ContentSummaryAndCompareStatus) {
        super('content-version-item');

        this.version = version;
        this.content = content;

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        if (this.hasWorkspaces()) {
            this.statusBlock = this.createStatusBlock();
        }

        this.createTooltip();
        this.descriptionBlock = new ContentVersionViewer();
        this.descriptionBlock.setObject(this.version);
        this.versionInfoBlock = new VersionInfoBlock(this.version);
        this.revertButton = this.createRevertButton();
        this.compareButton = this.createCompareButton();
    }

    private hasWorkspaces(): boolean {
        if (this.getCompareStatus() == null || !this.version.hasWorkspaces()) {
            return false;
        }
        return true;
    }

    private getCompareStatus(): CompareStatus {
        return this.content ? this.content.getCompareStatus() : null;
    }

    private createStatusBlock(): DivEl {
        const statusText: string = this.getStatusText();

        const statusDiv = new DivEl('status');
        statusDiv.setHtml(statusText);

        return statusDiv;
    }

    private getStatusClass(): string {
        if (!this.hasWorkspaces()) {
            return '';
        }

        let statusPostfix = '';

        if (this.isPublishPending()) {
           statusPostfix += ` ${PublishStatus.PENDING}`;
        }

        if (this.content.isPendingDelete() && this.version.hasPublishInfo()) {
            statusPostfix += ` ${PublishStatus.ONLINE}`;
        }

        if (this.version.isActive() && this.content.isPendingDelete()) {
            statusPostfix += ` ${CompareStatusFormatter.formatStatusClass(CompareStatus.PENDING_DELETE)}`;
        }

        return this.version.isActive() ? `${CompareStatusFormatter.formatStatusClassFromContent(this.content)}${statusPostfix}` : `${PublishStatus.ONLINE}${statusPostfix}`;
    }

    private getStatusText(): string {
        if (!this.hasWorkspaces()) {
            return '';
        }

        const statusPostfix: string = this.isPublishPending() ? ` (${PublishStatusFormatter.formatStatus(PublishStatus.PENDING)})` : '';

        return this.version.isActive() ? this.content.getStatusText() : `${PublishStatusFormatter.formatStatus(PublishStatus.ONLINE)}${statusPostfix}`;
    }

    private isPublishPending(): boolean {
        return this.content.getPublishStatus() === PublishStatus.PENDING;
    }

    private createTooltip() {

        if (!this.version.getPublishInfo() || !this.version.getPublishInfo().getMessage()) {
            return;
        }

        this.tooltip = new Tooltip(this, this.version.getPublishInfo().getMessage().trim(), 1000);
    }

    private createRevertButton(): ActionButton {
        const revertButton: ActionButton = new ActionButton(
            new Action(this.version.isActive() ? i18n('field.version.current') : i18n('field.version.revert')), false);

        if (this.content.isReadOnly()) {
            revertButton.setEnabled(false);
        } else {
            revertButton.setTitle(i18n('field.version.makeCurrent'));
        }

        return revertButton;
    }

    private createCompareButton(): ActionButton {
        const compareButton: ActionButton = new ActionButton(new Action(), false);

        compareButton
            .setTitle(i18n('tooltip.widget.versions.compareWithCurrentVersion'))
            .addClass('compare icon-compare icon-medium transparent');

        return compareButton;
    }

    private initListeners() {
        this.compareButton.getAction().onExecuted(this.openCompareDialog.bind(this));

        this.revertButton.onClicked((event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
        });

        if (!this.version.isActive()) {
            this.revertButton.getAction().onExecuted(() => {
                this.revert(this.getContentId(), this.version);
            });
        }

        this.addOnClickHandler();
    }

    private openCompareDialog() {
        CompareContentVersionsDialog.get()
            .setContent(this.content.getContentSummary())
            .setLeftVersion(this.version)
            .setRevertVersionCallback(this.revert)
            .open();
    }

    private revert(contentId: ContentId, version: ContentVersion) {
        new RevertVersionRequest(version.getId(), contentId.toString())
            .sendAndParse()
            .then((newVersionId) => {

                if (!newVersionId) {
                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                    return;
                }

                const modifiedDate = version.getModified();
                const dateTime = `${DateHelper.formatDate(modifiedDate)} ${DateHelper.getFormattedTimeFromDate(modifiedDate, false)}`;

                NotifyManager.get().showFeedback(i18n('notify.version.changed', dateTime));
                new ActiveContentVersionSetEvent(contentId, version.getId()).fire();
            })
            .catch(DefaultErrorHandler.handle);
    }

    private getContentId(): ContentId {
        return this.content ? this.content.getContentId() : null;
    }

    private toggleTooltip() {
        if (!this.tooltip) {
            return;
        }

        const isActive = this.hasClass('expanded');
        this.tooltip.setActive(isActive);
        if (isActive) {
            this.tooltip.show();
        } else {
            this.tooltip.hide();
        }
    }

    private addOnClickHandler() {
        this.onClicked(() => {
            this.collapseAllContentVersionItemViewsExcept(this);
            const wasExpanded = this.hasClass('expanded');
            this.toggleTooltip();
            this.toggleClass('expanded');
        });
    }

    private collapseAllContentVersionItemViewsExcept(itemContainer: Element) {
        $(this.getHTMLElement()).find('.content-version-item').not(itemContainer.getHTMLElement()).removeClass('expanded');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            if (this.statusBlock) {
                const statusClass: string = this.getStatusClass();
                if (statusClass) {
                    this.statusBlock.addClass(statusClass.toLowerCase());
                    this.addClass(statusClass.toLowerCase());
                }
                this.appendChild(this.statusBlock);
            }

            this.versionInfoBlock.appendChild(this.revertButton);
            this.descriptionBlock.appendChild(this.compareButton);

            this.appendChildren(this.descriptionBlock);
            this.appendChild(this.versionInfoBlock);

            return rendered;
        });
    }
}
