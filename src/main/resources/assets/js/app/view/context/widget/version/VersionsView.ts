import {ContentVersionViewer} from './ContentVersionViewer';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersions} from '../../../../ContentVersions';
import {ActiveContentVersionSetEvent} from '../../../../event/ActiveContentVersionSetEvent';
import {GetContentVersionsForViewRequest} from '../../../../resource/GetContentVersionsForViewRequest';
import {CompareStatus, CompareStatusFormatter} from '../../../../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {RevertVersionRequest} from '../../../../resource/RevertVersionRequest';
import {CompareContentVersionsDialog} from '../../../../dialog/CompareContentVersionsDialog';
import ContentId = api.content.ContentId;
import i18n = api.util.i18n;
import ActionButton = api.ui.button.ActionButton;
import Action = api.ui.Action;
import DivEl = api.dom.DivEl;
import PEl = api.dom.PEl;
import NamesAndIconViewBuilder = api.app.NamesAndIconViewBuilder;
import NamesAndIconViewSize = api.app.NamesAndIconViewSize;
import LiEl = api.dom.LiEl;
import NamesAndIconView = api.app.NamesAndIconView;

export class VersionsView
    extends api.ui.selector.list.ListBox<ContentVersionListItem> {

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

    reload(): wemQ.Promise<void> {
        return this.loadData().then((contentVersions: ContentVersion[]) => {
            this.updateView(contentVersions);
            this.notifyLoaded();
        });
    }

    createItemView(item: ContentVersionListItem, readOnly: boolean): api.dom.Element {
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

    private loadData(): wemQ.Promise<ContentVersion[]> {
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

    private createStatusBlock(item: ContentVersionListItem, itemEl: api.dom.Element) {
        if (this.hasWorkspaces(item.getContentVersion())) {
            this.addStatusDiv(item, itemEl);
        }

        this.createTooltip(item.getContentVersion(), itemEl);
    }

    private addStatusDiv(item: ContentVersionListItem, itemEl: api.dom.Element) {
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

    private createTooltip(item: ContentVersion, itemEl: api.dom.Element) {
        const dateTimeStamp: Date = item.getPublishInfo() ? item.getPublishInfo().getTimestamp() : item.getModified();
        const userName: string = item.getPublishInfo() ? item.getPublishInfo().getPublisherDisplayName() : item.getModifierDisplayName();
        const dateAsString: string = api.ui.treegrid.DateTimeFormatter.createHtml(dateTimeStamp);
        const tooltipText: string = i18n('tooltip.state.published', dateAsString, userName);

        return new api.ui.Tooltip(itemEl, tooltipText, 1000);
    }

    private createDataBlocks(item: ContentVersionListItem, itemEl: api.dom.Element) {
        const descriptionDiv: api.dom.Element = this.createDescriptionBlock(item);
        const versionInfoDiv: api.dom.Element = this.createVersionInfoBlock(item);

        itemEl.appendChildren(descriptionDiv, versionInfoDiv);
    }

    private createDescriptionBlock(item: ContentVersionListItem): api.dom.Element {
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
            .setContentId(this.content.getContentId())
            .setContentDisplayName(this.content.getDisplayName())
            .setLeftVersion(this.activeVersionId)
            .setRightVersion(item.getId())
            .setActiveVersion(this.activeVersionId)
            .open();
    }

    private createVersionInfoBlock(item: ContentVersionListItem): api.dom.Element {
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
                .setSubName(api.util.DateHelper.getModifiedString(contentVersion.getPublishInfo().getTimestamp()))
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
                    api.notify.NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                } else {
                    api.notify.NotifyManager.get().showFeedback(i18n('notify.version.changed', item.getId()));
                    new ActiveContentVersionSetEvent(this.getContentId(), item.getId()).fire();
                }
            }).catch(api.DefaultErrorHandler.handle);
    }

    private addOnClickHandler(itemContainer: api.dom.Element) {
        itemContainer.onClicked(() => {
            this.collapseAllContentVersionItemViewsExcept(itemContainer);

            if (!itemContainer.hasClass('active') || itemContainer.hasClass('online')) {
                itemContainer.toggleClass('expanded');
            }
        });
    }

    private collapseAllContentVersionItemViewsExcept(itemContainer: api.dom.Element) {
        wemjq(this.getHTMLElement()).find('.content-version-item').not(itemContainer.getHTMLElement()).removeClass('expanded');
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
