import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {ContentVersionViewer} from './ContentVersionViewer';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../../../../ContentVersion';
import {Branch} from '../../../../versioning/Branch';
import {PublishStatus} from '../../../../publish/PublishStatus';
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
import {DateTimeFormatter} from 'lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {Tooltip} from 'lib-admin-ui/ui/Tooltip';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentVersionListItem} from './ContentVersionListItem';
import {VersionInfoBlock} from './VersionInfoBlock';

export class ContentVersionListItemView
    extends LiEl {

    private item: ContentVersionListItem;
    private activeVersionId: string;
    private content: ContentSummaryAndCompareStatus;

    private statusBlock: DivEl;
    private descriptionBlock: ContentVersionViewer;
    private versionInfoBlock: VersionInfoBlock;

    private revertButton: ActionButton;
    private compareButton: ActionButton;

    constructor(item: ContentVersionListItem, activeVersionId: string, content: ContentSummaryAndCompareStatus) {
        super('content-version-item');

        this.item = item;
        this.activeVersionId = activeVersionId;
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
        this.descriptionBlock.setObject(this.item.getContentVersion(), this.item.isInMaster());
        this.versionInfoBlock = new VersionInfoBlock(this.item.getContentVersion());
        this.revertButton = this.createRevertButton();
        this.compareButton = this.createCompareButton();
    }

    private hasWorkspaces(): boolean {
        if (this.getCompareStatus() == null || !this.item.getContentVersion().hasWorkspaces()) {
            return false;
        }
        return true;
    }

    private getCompareStatus(): CompareStatus {
        return this.content ? this.content.getCompareStatus() : null;
    }

    private createStatusBlock(): DivEl {
        const isInMaster: boolean = this.item.isInMaster();
        const statusText: string = this.getStatusText();

        const statusDiv = new DivEl('status ' + (isInMaster ? Branch.MASTER : Branch.DRAFT));
        statusDiv.setHtml(statusText);

        return statusDiv;
    }

    private getStatusText(): string {
        const statusPostfix: string = this.isPublishPending() ?
                                      ` (${PublishStatus.PENDING.charAt(0).toUpperCase() + PublishStatus.PENDING.slice(1)})` : '';

        return `${CompareStatusFormatter.formatStatusTextFromContent(this.content)} ${statusPostfix}`;
    }

    private isPublishPending(): boolean {
        return this.content.getPublishStatus() === PublishStatus.PENDING;
    }

    private createTooltip() {
        const contentVersion: ContentVersion = this.item.getContentVersion();
        const dateTimeStamp: Date = contentVersion.getPublishInfo()
                                    ? contentVersion.getPublishInfo().getTimestamp()
                                    : contentVersion.getModified();
        const userName: string = contentVersion.getPublishInfo()
                                 ? contentVersion.getPublishInfo().getPublisherDisplayName()
                                 : contentVersion.getModifierDisplayName();
        const dateAsString: string = DateTimeFormatter.createHtml(dateTimeStamp);
        const tooltipText: string = i18n('tooltip.state.published', dateAsString, userName);

        return new Tooltip(this, tooltipText, 1000);
    }

    private createRevertButton(): ActionButton {
        const isActive: boolean = this.item.isActive();
        const revertButton: ActionButton = new ActionButton(
            new Action(isActive ? i18n('field.version.active') : i18n('field.version.revert')), false);

        if (this.content.isReadOnly()) {
            revertButton.setEnabled(false);
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

        if (!this.item.isActive()) {
            this.revertButton.getAction().onExecuted(() => {
                this.revert(this.item.getContentVersion());
            });
        }

        this.addOnClickHandler();
    }

    private openCompareDialog() {
        CompareContentVersionsDialog.get()
            .setContent(this.content.getContentSummary())
            .setLeftVersion(this.item.getContentVersion().getId())
            .setActiveVersion(this.activeVersionId)
            .open();
    }

    private revert(item: ContentVersion) {
        new RevertVersionRequest(item.getId(), this.getContentId().toString()).sendAndParse().then(
            (contentVersionId: string) => {
                if (contentVersionId === this.activeVersionId) {
                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                } else {
                    NotifyManager.get().showFeedback(i18n('notify.version.changed', item.getId()));
                    new ActiveContentVersionSetEvent(this.getContentId(), item.getId()).fire();
                }
            }).catch(DefaultErrorHandler.handle);
    }

    private getContentId(): ContentId {
        return this.content ? this.content.getContentId() : null;
    }

    private addOnClickHandler() {
        this.onClicked(() => {
            this.collapseAllContentVersionItemViewsExcept(this);

            if (!this.hasClass('active') || this.hasClass('online')) {
                this.toggleClass('expanded');
            }
        });
    }

    private collapseAllContentVersionItemViewsExcept(itemContainer: Element) {
        $(this.getHTMLElement()).find('.content-version-item').not(itemContainer.getHTMLElement()).removeClass('expanded');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            if (this.statusBlock) {
                const statusClass: string = this.getStatusClass();
                this.statusBlock.addClass(statusClass.toLowerCase());
                this.addClass(statusClass.toLowerCase());
                this.appendChild(this.statusBlock);
            }

            if (this.item.isActive()) {
                this.revertButton.addClass('active');
            }

            this.descriptionBlock.addClass('description');

            this.versionInfoBlock.appendChild(this.revertButton);
            this.descriptionBlock.appendChild(this.compareButton);

            this.appendChild(this.descriptionBlock);
            this.appendChild(this.versionInfoBlock);

            return rendered;
        });
    }

    private getStatusClass(): string {
        const statusPostfix = this.isPublishPending() ? ` ${PublishStatus.PENDING}` : '';

        return `${CompareStatusFormatter.formatStatusClassFromContent(this.content)}${statusPostfix}`;
    }
}
