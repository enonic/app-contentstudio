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

export class VersionsView
    extends api.ui.selector.list.ListBox<ContentVersion> {

    private content: ContentSummaryAndCompareStatus;
    private loadedListeners: { (): void }[] = [];
    private activeVersion: ContentVersion;

    private static branchMaster: string = 'master';

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

    private getStatus(contentVersion: ContentVersion): ContentVersionStatus {
        if (this.getCompareStatus() == null) {
            return null;
        }
        let result = null;

        let hasMaster = contentVersion.workspaces.some((workspace) => {
            return workspace === VersionsView.branchMaster;
        });

        contentVersion.workspaces.some((workspace: string) => {
            if (!hasMaster || workspace === VersionsView.branchMaster) {
                result = {workspace: workspace, status: this.getState(workspace)};
                return true;
            }
        });

        return result;
    }

    private getState(workspace: string): string {
        if (workspace === VersionsView.branchMaster) {
            return CompareStatusFormatter.formatStatus(CompareStatus.EQUAL);
        } else {
            return CompareStatusFormatter.formatStatusTextFromContent(this.content);
        }
    }

    private createStatusBlock(item: ContentVersion, itemEl: api.dom.Element) {
        let contentVersionStatus = this.getStatus(item);
        if (!!contentVersionStatus) {
            let statusDiv = new api.dom.DivEl('status ' + contentVersionStatus.workspace);
            statusDiv.setHtml(contentVersionStatus.status);
            itemEl.appendChild(statusDiv);

            if (contentVersionStatus.status.toLowerCase() === 'modified') {
                statusDiv.addClass('modified');
                itemEl.addClass('modified');
                this.createModifiedTooltip(item, itemEl);
            }

            if (contentVersionStatus.status.toLowerCase() === 'published') {
                statusDiv.addClass('published');
                itemEl.addClass('published');
                this.createPublishedTooltip(item, itemEl);
            }
        } else {
            item.publishInfo ? this.createPublishedTooltip(item, itemEl) : this.createModifiedTooltip(item, itemEl);
        }
    }

    private createModifiedTooltip(item: ContentVersion, itemEl: api.dom.Element) {
        const dateAsString = api.ui.treegrid.DateTimeFormatter.createHtml(item.modified);
        const tooltip = new api.ui.Tooltip(itemEl, i18n('tooltip.state.modified', dateAsString, item.modifierDisplayName),
            1000);
    }

    private createPublishedTooltip(item: ContentVersion, itemEl: api.dom.Element) {
        if (item.publishInfo) {
            const dateAsString = api.ui.treegrid.DateTimeFormatter.createHtml(item.publishInfo.timestamp);
            const tooltip = new api.ui.Tooltip(itemEl,
                i18n('tooltip.state.published', dateAsString, item.publishInfo.publisherDisplayName),
                1000);
        }
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
        return descriptionDiv;
    }

    private createVersionInfoBlock(item: ContentVersion): api.dom.Element {
        let versionInfoDiv = new api.dom.DivEl('version-info hidden');


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

        let isActive = item.id === this.activeVersion.id;
        let revertButton = new api.ui.button.ActionButton(
            new api.ui.Action(isActive ? i18n('field.version.active') : i18n('field.version.revert'))
                .onExecuted((action: api.ui.Action) => {
                    if (!isActive) {
                        new RevertVersionRequest(item.id, this.getContentId().toString()).sendAndParse().then(
                            (contentId: ContentId) => {
                                api.notify.NotifyManager.get().showFeedback(i18n('notify.version.changed', item.id));
                                new ActiveContentVersionSetEvent(this.getContentId(), item.id).fire();
                            });
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

        versionInfoDiv.appendChildren(revertButton);

        return versionInfoDiv;
    }

    private addOnClickHandler(itemContainer: api.dom.Element) {
        itemContainer.onClicked(() => {
            this.collapseAllContentVersionItemViewsExcept(itemContainer);

            if (!itemContainer.hasClass('active') || itemContainer.hasClass('published')) {
                itemContainer.toggleClass('expanded');
            }
        });
    }

    private collapseAllContentVersionItemViewsExcept(itemContainer: api.dom.Element) {
        wemjq(this.getHTMLElement()).find('.content-version-item').not(itemContainer.getHTMLElement()).removeClass('expanded');
    }
}

export class ContentVersionStatus {
    workspace: string;

    status: string;
}
