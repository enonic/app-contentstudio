import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentVersionHelper} from '../../../../ContentVersionHelper';
import {CompareContentVersionsDialog} from '../../../../dialog/CompareContentVersionsDialog';
import {WidgetItemView} from '../../WidgetItemView';
import {VersionHistoryItem} from './VersionHistoryItem';
import {VersionHistoryList} from './VersionHistoryList';
import {VersionHistoryListItem} from './VersionHistoryListItem';

export class VersionHistoryView extends WidgetItemView {

    private versionListView: VersionHistoryList;

    private statusBlock: DivEl;

    private content: ContentSummaryAndCompareStatus;

    private selectedItems: VersionHistoryItem[] = [];

    private buttonsWrapper: DivEl;

    private compareButton: ActionButton;

    private resetButton: ActionButton;

    public static debug: boolean = false;

    constructor() {
        super('version-widget-item-view');
    }

    public layout(): Q.Promise<void> {
        if (VersionHistoryView.debug) {
            console.debug('VersionsWidgetItemView.layout');
        }
        this.removeChildren();

        return super.layout().then(() => {
            this.versionListView = new VersionHistoryList();
            this.statusBlock = new DivEl('status');
            this.compareButton = this.createCompareButton();
            this.resetButton = this.createResetButton();
            this.buttonsWrapper = new DivEl('action-buttons-wrapper');
            this.buttonsWrapper.appendChildren(this.compareButton, this.resetButton);
            this.buttonsWrapper.hide();
            this.appendChildren(this.statusBlock, this.buttonsWrapper, this.versionListView);
            this.listenSelectionChange();
        });
    }

    private createCompareButton(): ActionButton {
        const actionButton = new ActionButton(new Action(i18n('widget.versions.compare')));

        actionButton.getAction().onExecuted(() => {
           this.openCompareDialog();
        });

        actionButton.setEnabled(false);
        actionButton.addClass('compare-button');

        return actionButton;
    }

    private listenSelectionChange(): void {
        this.versionListView.onItemsAdded((items, itemViews) => {
            itemViews.forEach((view: VersionHistoryListItem) => {
                view.onSelectionChanged((isSelected: boolean) => {
                    this.handleSelectionChange(view.getVersion(), isSelected);
                });
            });
        });
    }

    private createResetButton(): ActionButton {
        const actionButton = new ActionButton(new Action('X'));

        actionButton.getAction().onExecuted(() => {
            this.resetSelection();
        });

        return actionButton
            .setEnabled(false)
            .addClass('reset-compare-button')
            .setTitle(i18n('widget.versionhistory.cancelSelection')) as ActionButton;
    }

    private getContentStatus(content: ContentSummaryAndCompareStatus): string {
        const contentSummary: ContentSummary = content.getContentSummary();

        if (content.isScheduledPublishing()) {
            this.statusBlock.addClass('small');
            return i18n('widget.versionhistory.scheduled', DateHelper.formatDateTime(contentSummary.getPublishFromTime()));
        }

        if (content.isExpiredPublishing()) {
            this.statusBlock.addClass('small');
            return i18n('widget.versionhistory.expired', DateHelper.formatDateTime(contentSummary.getPublishToTime()));
        }

        if (content.isOnline() && !!contentSummary.getPublishToTime()) {
            this.statusBlock.addClass('small');
            return i18n('widget.versionhistory.publishedUntil', DateHelper.formatDateTime(contentSummary.getPublishToTime()));
        }

        return content.getStatusText();
    }

    public setContentAndUpdateView(content: ContentSummaryAndCompareStatus): Q.Promise<void> {
        if (VersionHistoryView.debug) {
            console.debug('VersionsWidgetItemView.setItem: ', content);
        }

        if (!this.versionListView) {
            return Q();
        }

        this.content = content;
        this.statusBlock.setClass(`status ${content.getStatusClass()}`).setHtml(this.getContentStatus(content));

        return this.reloadActivePanel();
    }

    private reloadActivePanel(): Q.Promise<void> {
        if (VersionHistoryView.debug) {
            console.debug('VersionsWidgetItemView.reloadActivePanel');
        }

        if (this.versionListView && this.content) {
            this.resetSelection();

            ContentVersionHelper.fetchAndSetActiveVersion(this.content.getContentId()).then(() => {
                this.versionListView.setContent(this.content);
            });
        }

        return Q();
    }

    private handleSelectionChange(item: VersionHistoryItem, isSelected: boolean): void {
        if (isSelected) {
            this.selectedItems.push(item);

            if (this.selectedItems.length > 1) {
                this.addClass('selection-limit-reached');
            }
        } else {
            this.selectedItems = this.selectedItems.filter(selectedItem => selectedItem.getId() !== item.getId());

            if (this.selectedItems.length < 2) {
                this.removeClass('selection-limit-reached');
            }
        }

        this.toggleClass('single-version-selected', this.selectedItems.length === 1);
        this.buttonsWrapper.setVisible(this.selectedItems.length > 0);
        this.compareButton.setEnabled(this.selectedItems.length > 1);
        this.resetButton.setEnabled(this.selectedItems.length > 0);
    }

    private openCompareDialog(): void {
        this.selectedItems.sort(this.sortByDate);

        CompareContentVersionsDialog.get()
            .setContent(this.content)
            .setLeftVersion(this.selectedItems[0])
            .setRightVersion(this.selectedItems[1])
            .open();
    }

    private sortByDate(v1: VersionHistoryItem, v2: VersionHistoryItem): number {
        return Number(v1.getContentVersion().getTimestamp()) - Number(v2.getContentVersion().getTimestamp());
    }

    private resetSelection(): void {
        this.versionListView.getItemViews().forEach((view: VersionHistoryListItem) => {
            view.setSelected(false);
        });
    }

}
