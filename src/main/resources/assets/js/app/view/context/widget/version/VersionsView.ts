import * as $ from 'jquery';
import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
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

export class VersionsView
    extends ListBox<ContentVersion> {

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

    reload(): Q.Promise<void> {
        return this.loadData().then((contentVersions: ContentVersion[]) => {
            this.updateView(contentVersions);
            this.notifyLoaded();
        });
    }

    createItemView(item: ContentVersion, readOnly: boolean): Element {
        let itemContainer = new LiEl('content-version-item');

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

    private createStatusBlock(contentVersion: ContentVersion, itemEl: Element) {
        if (this.hasWorkspaces(contentVersion)) {
            const isInMaster = this.isInMaster(contentVersion);
            const statusText = isInMaster ?
                               CompareStatusFormatter.formatStatus(CompareStatus.EQUAL) :
                               CompareStatusFormatter.formatStatusTextFromContent(this.content);
            const statusClass = isInMaster ?
                                CompareStatusFormatter.formatStatus(CompareStatus.EQUAL, null, true) :
                                CompareStatusFormatter.formatStatusClassFromContent(this.content);

            let statusDiv = new DivEl('status ' + (isInMaster ? VersionsView.branchMaster : VersionsView.branchDraft));
            statusDiv.setHtml(statusText);
            itemEl.appendChild(statusDiv);

            statusDiv.addClass(statusClass.toLowerCase());
            itemEl.addClass(statusClass.toLowerCase());
        }

        this.createTooltip(contentVersion, itemEl);
    }

    private createTooltip(item: ContentVersion, itemEl: Element) {
        const dateTimeStamp = item.publishInfo ? item.publishInfo.timestamp : item.modified;
        const userName = item.publishInfo ? item.publishInfo.publisherDisplayName : item.modifierDisplayName;
        const dateAsString = DateTimeFormatter.createHtml(dateTimeStamp);
        const toolTipKey = item.publishInfo ? 'tooltip.state.published' :
                                (item.isStateReady() ? 'tooltip.state.markedAsReady' : 'tooltip.state.modified');
        const tooltipText = i18n(toolTipKey, dateAsString, userName);

        return new Tooltip(itemEl, tooltipText, 1000);
    }

    private createDataBlocks(item: ContentVersion, itemEl: Element) {
        let descriptionDiv = this.createDescriptionBlock(item);
        let versionInfoDiv = this.createVersionInfoBlock(item);

        itemEl.appendChildren(descriptionDiv, versionInfoDiv);
    }

    private createDescriptionBlock(item: ContentVersion): Element {
        let descriptionDiv = new ContentVersionViewer();
        descriptionDiv.addClass('description');
        descriptionDiv.setObject(item);

        const compareButton = new ActionButton(
            new Action()
                .onExecuted((action: Action) => {
                    CompareContentVersionsDialog.get()
                        .setContent(this.content.getContentSummary())
                        .setLeftVersion(item.id)
                        .setActiveVersion(this.activeVersion.id)
                        .open();
                }), false);

        compareButton
            .setTitle(i18n('tooltip.widget.versions.compareWithCurrentVersion'))
            .addClass('compare icon-compare icon-medium transparent');

        descriptionDiv.appendChild(compareButton);

        return descriptionDiv;
    }

    private createVersionInfoBlock(item: ContentVersion): Element {
        const versionInfoDiv = new DivEl('version-info hidden');

        if (item.publishInfo) {
            if (item.publishInfo.message) {
                const messageDiv = new DivEl('version-info-message');
                messageDiv.appendChildren(new PEl('message').setHtml(item.publishInfo.message));
                versionInfoDiv.appendChild(messageDiv);
            }

            const publisher = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
            publisher
                .setMainName(item.publishInfo.publisherDisplayName)
                .setSubName(DateHelper.getModifiedString(item.publishInfo.timestamp))
                .setIconClass(item.isStateReady() ? 'icon-state-ready' : 'icon-state-in-progress');

            versionInfoDiv.appendChild(publisher);

        }

        const isActive = item.id === this.activeVersion.id;
        const revertButton = new ActionButton(
            new Action(isActive ? i18n('field.version.active') : i18n('field.version.revert'))
                .onExecuted((action: Action) => {
                    if (!isActive) {
                        new RevertVersionRequest(item.id, this.getContentId().toString()).sendAndParse().then(
                            (contentVersionId: string) => {
                                if (contentVersionId === this.activeVersion.id) {
                                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                                } else {
                                    NotifyManager.get().showFeedback(i18n('notify.version.changed', item.id));
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
