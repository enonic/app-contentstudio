import {ContentVersionViewer} from './ContentVersionViewer';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersions} from '../../../../ContentVersions';
import {ActiveContentVersionSetEvent} from '../../../../event/ActiveContentVersionSetEvent';
import {GetContentVersionsForViewRequest} from '../../../../resource/GetContentVersionsForViewRequest';
import {CompareStatus, CompareStatusFormatter} from '../../../../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import ContentId = api.content.ContentId;
import WorkflowState = api.content.WorkflowState;
import i18n = api.util.i18n;
import {RevertVersionRequest} from '../../../../resource/RevertVersionRequest';
import ActionButton = api.ui.button.ActionButton;
import Action = api.ui.Action;
import {CompareContentVersionsDialog} from '../../../../dialog/CompareContentVersionsDialog';

export class VersionsView
    extends api.ui.selector.list.ListBox<ContentVersion> {

    private content: ContentSummaryAndCompareStatus;
    private loadedListeners: { (): void }[] = [];
    private activeVersion: ContentVersion;

    private static readonly branchMaster: string = 'master';
    private static readonly branchDraft: string = 'draft';

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

    createItemView(item: ContentVersion, readOnly: boolean): api.dom.Element {
        let itemContainer = new api.dom.LiEl('content-version-item');

        this.createStatusBlock(item, itemContainer);
        this.createDataBlocks(item, itemContainer);
        this.addOnClickHandler(itemContainer);

        return itemContainer;
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

    private loadData(): wemQ.Promise<ContentVersion[]> {
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

    private hasWorkspaces(contentVersion: ContentVersion): boolean {
        if (this.getCompareStatus() == null || !contentVersion.workspaces.length) {
            return false;
        }
        return true;
    }

    private isInMaster(contentVersion: ContentVersion): boolean {
        return contentVersion.workspaces.some((workspace) => {
            return workspace === VersionsView.branchMaster;
        });
    }

    private createStatusBlock(contentVersion: ContentVersion, itemEl: api.dom.Element) {
        if (this.hasWorkspaces(contentVersion)) {
            const isInMaster = this.isInMaster(contentVersion);
            const statusText = isInMaster ?
                               CompareStatusFormatter.formatStatus(CompareStatus.EQUAL) :
                               CompareStatusFormatter.formatStatusTextFromContent(this.content);
            const statusClass = isInMaster ?
                               CompareStatusFormatter.formatStatus(CompareStatus.EQUAL, null, true) :
                               CompareStatusFormatter.formatStatusClassFromContent(this.content);

            let statusDiv = new api.dom.DivEl('status ' + (isInMaster ? VersionsView.branchMaster : VersionsView.branchDraft));
            statusDiv.setHtml(statusText);
            itemEl.appendChild(statusDiv);

            statusDiv.addClass(statusClass.toLowerCase());
            itemEl.addClass(statusClass.toLowerCase());
        }

        this.createTooltip(contentVersion, itemEl);
    }

    private createTooltip(item: ContentVersion, itemEl: api.dom.Element) {
        const dateTimeStamp = item.publishInfo ? item.publishInfo.timestamp : item.modified;
        const userName = item.publishInfo ? item.publishInfo.publisherDisplayName : item.modifierDisplayName;
        const dateAsString = api.ui.treegrid.DateTimeFormatter.createHtml(dateTimeStamp);
        const tooltipText = i18n('tooltip.state.published', dateAsString, userName);

        return new api.ui.Tooltip(itemEl, tooltipText, 1000);
    }

    private createDataBlocks(item: ContentVersion, itemEl: api.dom.Element) {
        let descriptionDiv = this.createDescriptionBlock(item);
        let versionInfoDiv = this.createVersionInfoBlock(item);

        itemEl.appendChildren(descriptionDiv, versionInfoDiv);
    }

    private createDescriptionBlock(item: ContentVersion): api.dom.Element {
        let descriptionDiv = new ContentVersionViewer();
        descriptionDiv.addClass('description');
        descriptionDiv.setObject(item);

        const compareButton = new ActionButton(
            new Action()
                .onExecuted((action: Action) => {
                    CompareContentVersionsDialog.get()
                        .setContentId(this.content.getContentId())
                        .setContentDisplayName(this.content.getDisplayName())
                        .setLeftVersion(item.id)
                        .setRightVersion(this.activeVersion.id)
                        .setActiveVersion(this.activeVersion.id)
                        .open();
                }), false);

        compareButton
            .setTitle(i18n('tooltip.widget.versions.compareWithCurrentVersion'))
            .addClass('compare icon-copy transparent');

        descriptionDiv.appendChild(compareButton);

        return descriptionDiv;
    }

    private createVersionInfoBlock(item: ContentVersion): api.dom.Element {
        const versionInfoDiv = new api.dom.DivEl('version-info hidden');

        if (item.publishInfo) {
            if (item.publishInfo.message) {
                const messageDiv = new api.dom.DivEl('version-info-message');
                messageDiv.appendChildren(new api.dom.PEl('message').setHtml(item.publishInfo.message));
                versionInfoDiv.appendChild(messageDiv);
            }

            const publisher = new api.app.NamesAndIconViewBuilder().setSize(api.app.NamesAndIconViewSize.small).build();
            publisher
                .setMainName(item.publishInfo.publisherDisplayName)
                .setSubName(api.util.DateHelper.getModifiedString(item.publishInfo.timestamp))
                .setIconClass(item.workflowInfo && WorkflowState.READY === item.workflowInfo.getState()
                              ? 'icon-state-ready'
                              : 'icon-state-in-progress');

            versionInfoDiv.appendChild(publisher);

        }

        const isActive = item.id === this.activeVersion.id;
        const revertButton = new ActionButton(
            new api.ui.Action(isActive ? i18n('field.version.active') : i18n('field.version.revert'))
                .onExecuted((action: api.ui.Action) => {
                    if (!isActive) {
                        new RevertVersionRequest(item.id, this.getContentId().toString()).sendAndParse().then(
                            (contentVersionId: string) => {
                                if (contentVersionId === this.activeVersion.id) {
                                    api.notify.NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                                } else {
                                    api.notify.NotifyManager.get().showFeedback(i18n('notify.version.changed', item.id));
                                    new ActiveContentVersionSetEvent(this.getContentId(), item.id).fire();
                                }
                            });
                    }
                }), false);

        if (isActive) {
            revertButton.addClass('active');
        }

        if (this.content.isReadOnly()) {
            revertButton.setEnabled(false);
        }

        versionInfoDiv.appendChild(revertButton);

        revertButton.onClicked((event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
        });

        versionInfoDiv.appendChildren(revertButton);

        return versionInfoDiv;
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
