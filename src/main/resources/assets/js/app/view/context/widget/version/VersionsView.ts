import * as $ from 'jquery';
import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {PEl} from 'lib-admin-ui/dom/PEl';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {Action} from 'lib-admin-ui/ui/Action';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {DateTimeFormatter} from 'lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {Tooltip} from 'lib-admin-ui/ui/Tooltip';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {ContentVersionViewer} from './ContentVersionViewer';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersions} from '../../../../ContentVersions';
import {ActiveContentVersionSetEvent} from '../../../../event/ActiveContentVersionSetEvent';
import {GetContentVersionsForViewRequest} from '../../../../resource/GetContentVersionsForViewRequest';
import {CompareStatus, CompareStatusFormatter} from '../../../../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {RevertVersionRequest} from '../../../../resource/RevertVersionRequest';
import {CompareContentVersionsDialog} from '../../../../dialog/CompareContentVersionsDialog';
import {Branch} from '../../../../versioning/Branch';
import {PublishStatus} from '../../../../publish/PublishStatus';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';

export class VersionsView
    extends ListBox<ContentVersion> {

    private content: ContentSummaryAndCompareStatus;
    private loadedListeners: { (): void }[] = [];
    private activeVersion: ContentVersion;

    constructor() {
        super('all-content-versions');
    }

    setContentData(item: ContentSummaryAndCompareStatus) {
        this.content = item;
    }

    getContentId(): ContentId {
        return this.content ? this.content.getContentId() : null;
    }

    reload(): Q.Promise<void> {
        return this.loadData().then((contentVersions: ContentVersion[]) => {
            this.updateView(contentVersions);
            this.notifyLoaded();
        }).catch(DefaultErrorHandler.handle);
    }

    private loadData(): Q.Promise<ContentVersion[]> {
        if (this.getContentId()) {
            return new GetContentVersionsForViewRequest(this.getContentId()).sendAndParse().then(
                (contentVersions: ContentVersions) => {
                    this.activeVersion = contentVersions.getActiveVersion();
                    return contentVersions.getContentVersions();
                });
        } else {
            throw new Error('Required contentId not set for ActiveContentVersionsTreeGrid');
        }
    }

    private updateView(contentVersions: ContentVersion[]) {
        this.clearItems();
        this.setItems(contentVersions);
        this.getItemView(this.activeVersion).addClass('active');
    }

    createItemView(item: ContentVersion, readOnly: boolean): Element {
        return new VersionItem(item, this.activeVersion, this.content);
    }

    getItemId(item: ContentVersion): string {
        return item.id;
    }

    onLoaded(listener: () => void) {
        this.loadedListeners.push(listener);
    }

    unLoaded(listener: () => void) {
        this.loadedListeners = this.loadedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyLoaded() {
        this.loadedListeners.forEach((listener) => {
            listener();
        });
    }

}

class VersionItem
    extends LiEl {

    private contentVersion: ContentVersion;
    private activeVersion: ContentVersion;
    private content: ContentSummaryAndCompareStatus;

    private statusBlock: DivEl;
    private descriptionBlock: ContentVersionViewer;
    private versionInfoBlock: VersionItemInfoBlock;
    private compareButton: ActionButton;

    constructor(version: ContentVersion, activeVersion: ContentVersion, content: ContentSummaryAndCompareStatus) {
        super('content-version-item');

        this.contentVersion = version;
        this.activeVersion = activeVersion;
        this.content = content;

        this.initElements();
        this.createTooltip();
        this.initListeners();
    }

    private initElements() {
        if (this.hasWorkspaces()) {
            this.statusBlock = this.createStatusBlock();
        }

        this.descriptionBlock = this.createDescriptionBlock();
        this.versionInfoBlock = new VersionItemInfoBlock(this.contentVersion, this.activeVersion, this.content);
        this.compareButton = this.createCompareButton();
    }

    private hasWorkspaces(): boolean {
        if (this.getCompareStatus() == null || !this.contentVersion.hasWorkspaces()) {
            return false;
        }
        return true;
    }

    private getCompareStatus(): CompareStatus {
        return this.content ? this.content.getCompareStatus() : null;
    }

    private createStatusBlock(): DivEl {
        const statusDiv: DivEl = new DivEl('status');
        statusDiv.setHtml(this.getStatusText());

        return statusDiv;
    }

    private isPublishPending(): boolean {
        return this.content.getPublishStatus() === PublishStatus.PENDING;
    }

    private createDescriptionBlock(): ContentVersionViewer {
        const descriptionBlock: ContentVersionViewer = new ContentVersionViewer();
        descriptionBlock.setObject(this.contentVersion);

        return descriptionBlock;
    }

    private createCompareButton(): ActionButton {
        const compareButton: ActionButton = new ActionButton(new Action(), false);

        compareButton
            .setTitle(i18n('tooltip.widget.versions.compareWithCurrentVersion'))
            .addClass('compare icon-compare icon-medium transparent');

        return compareButton;
    }

    private createTooltip() {
        const dateTimeStamp: Date = this.contentVersion.publishInfo
                                    ? this.contentVersion.publishInfo.timestamp
                                    : this.contentVersion.modified;
        const userName: string = this.contentVersion.publishInfo
                                 ? this.contentVersion.publishInfo.publisherDisplayName
                                 : this.contentVersion.modifierDisplayName;
        const dateAsString: string = DateTimeFormatter.createHtml(dateTimeStamp);
        const toolTipKey: string = this.contentVersion.publishInfo ? 'tooltip.state.published' :
                                   (this.contentVersion.isStateReady() ? 'tooltip.state.markedAsReady' : 'tooltip.state.modified');
        const tooltipText: string = i18n(toolTipKey, dateAsString, userName);

        return new Tooltip(this, tooltipText, 1000);
    }

    private initListeners() {
        this.addOnClickHandler();
        this.addCompareButtonAction();
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

    private addCompareButtonAction() {
        this.compareButton.getAction().onExecuted(() => {
            CompareContentVersionsDialog.get()
                .setContent(this.content.getContentSummary())
                .setLeftVersion(this.contentVersion.id)
                .setActiveVersion(this.activeVersion.id)
                .open();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            if (this.statusBlock) {
                const statusClass: string = this.getStatusClass();
                this.statusBlock.addClass(statusClass);
                this.addClass(statusClass);
                this.appendChild(this.statusBlock);
            }

            this.descriptionBlock.addClass('description');
            this.descriptionBlock.appendChild(this.compareButton);

            this.appendChild(this.descriptionBlock);
            this.appendChild(this.versionInfoBlock);

            return rendered;
        });
    }

    private getStatusText(): string {
        if (!this.contentVersion.isInMaster()) {
            return CompareStatusFormatter.formatStatusTextFromContent(this.content);
        }

        const statusPostfix = this.isPublishPending() ?
            ` (${PublishStatus.PENDING.charAt(0).toUpperCase() + PublishStatus.PENDING.slice(1)})` : '';

        return `${CompareStatusFormatter.formatStatusText(CompareStatus.EQUAL)} ${statusPostfix}`;
    }

    private getStatusClass(): string {
        if (!this.contentVersion.isInMaster()) {
            return CompareStatusFormatter.formatStatusClassFromContent(this.content);
        }

        const statusPostfix = this.isPublishPending() ? ` ${PublishStatus.PENDING}` : '';

        return `${CompareStatusFormatter.formatStatusClass(CompareStatus.EQUAL)}${statusPostfix}`;
    }
}

class VersionItemInfoBlock
    extends DivEl {

    private contentVersion: ContentVersion;
    private activeVersion: ContentVersion;
    private content: ContentSummaryAndCompareStatus;

    private messageBlock: DivEl;
    private publisherBlock: NamesAndIconView;
    private revertButton: ActionButton;

    constructor(version: ContentVersion, activeVersion: ContentVersion, content: ContentSummaryAndCompareStatus) {
        super('version-info hidden');

        this.contentVersion = version;
        this.activeVersion = activeVersion;
        this.content = content;

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        if (this.contentVersion.hasPublishInfo()) {
            if (this.contentVersion.hasPublishInfoMessage()) {
                this.messageBlock = new DivEl('version-info-message');
            }

            this.publisherBlock = this.createPublisherBlock();
        }

        this.revertButton = this.createRevertButton();
    }

    private createPublisherBlock(): NamesAndIconView {
        const publisher: NamesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        publisher
            .setMainName(this.contentVersion.publishInfo.publisherDisplayName)
            .setSubName(DateHelper.getModifiedString(this.contentVersion.publishInfo.timestamp))
            .setIconClass(this.contentVersion.isStateReady() ? 'icon-state-ready' : 'icon-state-in-progress');

        return publisher;
    }

    private createRevertButton(): ActionButton {
        const isActive: boolean = this.contentVersion.id === this.activeVersion.id;
        const revertButton: ActionButton = new ActionButton(
            new Action(isActive ? i18n('field.version.active') : i18n('field.version.revert')), false);

        if (isActive) {
            revertButton.addClass('active');
        }

        if (this.content.isReadOnly()) {
            revertButton.setEnabled(false);
        }

        return revertButton;
    }

    private initListeners() {
        this.addRevertButtonAction();
    }

    private addRevertButtonAction() {
        this.revertButton.onClicked((event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
        });

        const isActive: boolean = this.contentVersion.id === this.activeVersion.id;
        if (isActive) {
            return;
        }

        this.revertButton.getAction().onExecuted(() => this.revert());
    }

    private revert() {
        new RevertVersionRequest(this.contentVersion.id, this.getContentId().toString()).sendAndParse().then(
            (contentVersionId: string) => {
                if (contentVersionId === this.activeVersion.id) {
                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                } else {
                    NotifyManager.get().showFeedback(i18n('notify.version.changed', this.contentVersion.id));
                    new ActiveContentVersionSetEvent(this.getContentId(), this.contentVersion.id).fire();
                }
            }).catch(DefaultErrorHandler.handle);
    }

    private getContentId(): ContentId {
        return this.content ? this.content.getContentId() : null;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            if (this.messageBlock) {
                this.messageBlock.appendChildren(new PEl('message').setHtml(this.contentVersion.getPublishInfoMessage()));
                this.appendChild(this.messageBlock);
            }

            if (this.publisherBlock) {
                this.appendChild(this.publisherBlock);
            }

            this.appendChild(this.revertButton);

            return rendered;
        });
    }
}
