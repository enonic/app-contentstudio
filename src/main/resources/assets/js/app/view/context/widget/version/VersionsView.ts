import * as $ from 'jquery';
import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {PEl} from 'lib-admin-ui/dom/PEl';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Action} from 'lib-admin-ui/ui/Action';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {DateTimeFormatter} from 'lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {Tooltip} from 'lib-admin-ui/ui/Tooltip';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconView} from 'lib-admin-ui/app/NamesAndIconView';
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

export class VersionsView
    extends ListBox<ContentVersionListItem> {

    private content: ContentSummaryAndCompareStatus;
    private loadedListeners: { (): void }[] = [];
    private activeVersionId: string;

    constructor() {
        super('all-content-versions');
    }

    setContentData(item: ContentSummaryAndCompareStatus) {
        this.content = item;
    }

    getContentId(): ContentId {
        return this.content ? this.content.getContentId() : null;
    }

    getCompareStatus(): CompareStatus {
        return this.content ? this.content.getCompareStatus() : null;
    }

    reload(): Q.Promise<void> {
        return this.loadData().then((contentVersions: ContentVersion[]) => {
            this.updateView(contentVersions);
            this.notifyLoaded();
        });
    }

    createItemView(item: ContentVersionListItem, readOnly: boolean): Element {
        const itemContainer: LiEl = new LiEl('content-version-item').toggleClass('active', item.isActive());

        this.createStatusBlock(item, itemContainer);
        this.createDataBlocks(item, itemContainer);
        this.addOnClickHandler(itemContainer);

        return itemContainer;
    }

    getItemId(item: ContentVersionListItem): string {
        return item.getId();
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

    private loadData(): Q.Promise<ContentVersion[]> {
        if (!this.getContentId()) {
            throw new Error('Required contentId not set for ActiveContentVersionsTreeGrid');
        }

        return new GetContentVersionsForViewRequest(this.getContentId()).sendAndParse().then((contentVersions: ContentVersions) => {
            this.activeVersionId = contentVersions.getActiveVersion().getId();
            return contentVersions.getContentVersions();
        });
    }

    private updateView(contentVersions: ContentVersion[]) {
        this.clearItems();
        this.setItems(this.processContentVersions(contentVersions));
    }

    private processContentVersions(contentVersions: ContentVersion[]): ContentVersionListItem[] {
        const result: ContentVersionListItem[] = [];

        contentVersions.forEach((contentVersion: ContentVersion) => {
            const isActive: boolean = contentVersion.getId() === this.activeVersionId;

            if (contentVersion.hasBothWorkspaces() && this.getCompareStatus() === CompareStatus.PENDING_DELETE) {
                result.push(new ContentVersionListItem(contentVersion, ContentVersion.branchDraft, isActive));
            }

            const workspace: string = contentVersion.isInMaster() ? ContentVersion.branchMaster : ContentVersion.branchDraft;
            result.push(new ContentVersionListItem(contentVersion, workspace, isActive));
        });

        return result;
    }

    private hasWorkspaces(version: ContentVersion): boolean {
        if (this.getCompareStatus() == null || !version.hasWorkspaces()) {
            return false;
        }
        return true;
    }

    private createStatusBlock(item: ContentVersionListItem, itemEl: Element) {
        if (this.hasWorkspaces(item.getContentVersion())) {
            this.addStatusDiv(item, itemEl);
        }

        this.createTooltip(item.getContentVersion(), itemEl);
    }

    private addStatusDiv(item: ContentVersionListItem, itemEl: Element) {
        const isInMaster: boolean = item.isInMaster();
        const statusText: string = isInMaster ?
                                   CompareStatusFormatter.formatStatus(CompareStatus.EQUAL) :
                                   CompareStatusFormatter.formatStatusTextFromContent(this.content);
        const statusClass: string = isInMaster ?
                                    CompareStatusFormatter.formatStatus(CompareStatus.EQUAL, null, true) :
                                    CompareStatusFormatter.formatStatusClassFromContent(this.content);

        const statusDiv = new DivEl('status ' + (isInMaster ? ContentVersion.branchMaster : ContentVersion.branchDraft));
        statusDiv.setHtml(statusText);
        itemEl.appendChild(statusDiv);

        statusDiv.addClass(statusClass.toLowerCase());
        itemEl.addClass(statusClass.toLowerCase());
    }

    private createTooltip(item: ContentVersion, itemEl: Element) {
        const dateTimeStamp: Date = item.getPublishInfo() ? item.getPublishInfo().getTimestamp() : item.getModified();
        const userName: string = item.getPublishInfo() ? item.getPublishInfo().getPublisherDisplayName() : item.getModifierDisplayName();
        const dateAsString: string = DateTimeFormatter.createHtml(dateTimeStamp);
        const tooltipText: string = i18n('tooltip.state.published', dateAsString, userName);

        return new Tooltip(itemEl, tooltipText, 1000);
    }

    private createDataBlocks(item: ContentVersionListItem, itemEl: Element) {
        const descriptionDiv: Element = this.createDescriptionBlock(item);
        const versionInfoDiv: Element = this.createVersionInfoBlock(item);

        itemEl.appendChildren(descriptionDiv, versionInfoDiv);
    }

    private createDescriptionBlock(item: ContentVersionListItem): Element {
        const descriptionDiv: ContentVersionViewer = new ContentVersionViewer();
        descriptionDiv.addClass('description');
        descriptionDiv.setObject(item.getContentVersion(), item.isInMaster());
        descriptionDiv.appendChild(this.createCompareButton(item));

        return descriptionDiv;
    }

    private createCompareButton(item: ContentVersionListItem): ActionButton {
        const compareButton: ActionButton = new ActionButton(
            new Action().onExecuted(() => this.openCompareDialog(item)), false);

        compareButton
            .setTitle(i18n('tooltip.widget.versions.compareWithCurrentVersion'))
            .addClass('compare icon-compare icon-medium transparent');

        return compareButton;
    }

    private openCompareDialog(item: ContentVersionListItem) {
        CompareContentVersionsDialog.get()
            .setContent(this.content.getContentSummary())
            .setLeftVersion(item.getContentVersion().getId())
            .setActiveVersion(this.activeVersionId)
            .open();
    }

    private createVersionInfoBlock(item: ContentVersionListItem): Element {
        const contentVersion: ContentVersion = item.getContentVersion();
        const versionInfoDiv = new DivEl('version-info hidden');

        if (contentVersion.hasPublishInfo()) {
            if (contentVersion.getPublishInfo().getMessage()) {
                const messageDiv = new DivEl('version-info-message');
                messageDiv.appendChildren(new PEl('message').setHtml(contentVersion.getPublishInfo().getMessage()));
                versionInfoDiv.appendChild(messageDiv);
            }

            const publisher: NamesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
            publisher
                .setMainName(contentVersion.getPublishInfo().getPublisherDisplayName())
                .setSubName(DateHelper.getModifiedString(contentVersion.getPublishInfo().getTimestamp()))
                .setIconClass(contentVersion.isInReadyState() ? 'icon-state-ready' : 'icon-state-in-progress');

            versionInfoDiv.appendChild(publisher);
        }

        versionInfoDiv.appendChild(this.createRevertButton(item));

        return versionInfoDiv;
    }

    private createRevertButton(item: ContentVersionListItem): ActionButton {
        const isActive: boolean = item.isActive();
        const revertButton: ActionButton = new ActionButton(
            new Action(isActive ? i18n('field.version.active') : i18n('field.version.revert'))
                .onExecuted(() => {
                    if (!isActive) {
                        this.revert(item.getContentVersion());
                    }
                }), false);

        if (isActive) {
            revertButton.addClass('active');
        }

        if (this.content.isReadOnly()) {
            revertButton.setEnabled(false);
        }

        revertButton.onClicked((event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
        });


        return revertButton;
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

    private addOnClickHandler(itemContainer: Element) {
        itemContainer.onClicked(() => {
            this.collapseAllContentVersionItemViewsExcept(itemContainer);

            if (!itemContainer.hasClass('active') || itemContainer.hasClass('online')) {
                itemContainer.toggleClass('expanded');
            }
        });
    }

    private collapseAllContentVersionItemViewsExcept(itemContainer: Element) {
        $(this.getHTMLElement()).find('.content-version-item').not(itemContainer.getHTMLElement()).removeClass('expanded');
    }
}

export class ContentVersionListItem {

    private contentVersion: ContentVersion;

    private workspace: string;

    private active: boolean;

    constructor(contentVersion: ContentVersion, workspace: string = ContentVersion.branchDraft, active: boolean = false) {
        this.contentVersion = contentVersion;
        this.workspace = workspace;
        this.active = active;
    }

    getContentVersion(): ContentVersion {
        return this.contentVersion;
    }

    getId(): string {
        return `${this.contentVersion.getId()}:${this.workspace}`;
    }

    isActive(): boolean {
        return this.active;
    }

    isInMaster(): boolean {
        return this.workspace === ContentVersion.branchMaster;
    }

}
