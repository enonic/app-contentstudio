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
import {Tooltip} from 'lib-admin-ui/ui/Tooltip';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {VersionInfoBlock} from './VersionInfoBlock';

export class ContentVersionListItemView
    extends LiEl {

    private item: ContentVersion;
    private activeVersionId: string;
    private content: ContentSummaryAndCompareStatus;
    private isActive: boolean;
    private tooltip: Tooltip;

    private statusBlock: DivEl;
    private descriptionBlock: ContentVersionViewer;
    private versionInfoBlock: VersionInfoBlock;

    private revertButton: ActionButton;
    private compareButton: ActionButton;

    constructor(item: ContentVersion, activeVersionId: string, content: ContentSummaryAndCompareStatus) {
        super('content-version-item');

        this.item = item;
        this.activeVersionId = activeVersionId;
        this.content = content;
        this.isActive = this.item.getId() === this.activeVersionId;

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        if (this.hasWorkspaces()) {
            this.statusBlock = this.createStatusBlock();
        }

        this.createTooltip();
        this.descriptionBlock = new ContentVersionViewer();
        this.descriptionBlock.setObject(this.item);
        this.versionInfoBlock = new VersionInfoBlock(this.item);
        this.revertButton = this.createRevertButton();
        this.compareButton = this.createCompareButton();
    }

    private hasWorkspaces(): boolean {
        if (this.getCompareStatus() == null || !this.item.hasWorkspaces()) {
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

        if (!this.item.getPublishInfo() || !this.item.getPublishInfo().getMessage()) {
            return;
        }

        this.tooltip = new Tooltip(this, this.item.getPublishInfo().getMessage().trim(), 1000);
    }

    private createRevertButton(): ActionButton {
        const revertButton: ActionButton = new ActionButton(
            new Action(this.isActive ? i18n('field.version.active') : i18n('field.version.revert')), false);

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

        if (!this.isActive) {
            this.revertButton.getAction().onExecuted(() => {
                this.revert();
            });
        }

        this.addOnClickHandler();
    }

    private openCompareDialog() {
        CompareContentVersionsDialog.get()
            .setContent(this.content.getContentSummary())
            .setLeftVersion(this.item)
            .setActiveVersionId(this.activeVersionId)
            .open();
    }

    private revert() {
        new RevertVersionRequest(this.item.getId(), this.getContentId().toString()).sendAndParse().then(
            (contentVersionId: string) => {
                if (contentVersionId === this.activeVersionId) {
                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                } else {
                    NotifyManager.get().showFeedback(i18n('notify.version.changed', this.item.getId()));
                    new ActiveContentVersionSetEvent(this.getContentId(), this.item.getId()).fire();
                }
            }).catch(DefaultErrorHandler.handle);
    }

    private getContentId(): ContentId {
        return this.content ? this.content.getContentId() : null;
    }

    private addOnClickHandler() {
        this.onClicked(() => {
            this.collapseAllContentVersionItemViewsExcept(this);
            const wasExpanded = this.hasClass('expanded');
            this.toggleClass('expanded');
            this.tooltip.setActive(wasExpanded);
            if (wasExpanded) {
                this.tooltip.show();
            } else {
                this.tooltip.hide();
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

            this.descriptionBlock.addClass('description');

            this.versionInfoBlock.appendChild(this.revertButton);
            this.descriptionBlock.appendChild(this.compareButton);

            this.appendChildren(this.descriptionBlock);
            this.appendChild(this.versionInfoBlock);

            return rendered;
        });
    }

    private getStatusClass(): string {
        const statusPostfix = this.isPublishPending() ? ` ${PublishStatus.PENDING}` : '';

        return `${CompareStatusFormatter.formatStatusClassFromContent(this.content)}${statusPostfix}`;
    }
}
