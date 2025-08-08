import {ArrayHelper} from '@enonic/lib-admin-ui/util/ArrayHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {DialogTogglableItemList, DialogTogglableItemListConfig} from '../dialog/DialogTogglableItemList';
import {TogglableStatusSelectionItem} from '../dialog/TogglableStatusSelectionItem';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';

export interface PublishDialogItemListConfig
    extends DialogTogglableItemListConfig {

    allowOnlyItemRemoval?: boolean;
}

export class PublishDialogItemList
    extends DialogTogglableItemList {

    private excludeChildrenIds: ContentId[] = [];

    declare protected config: PublishDialogItemListConfig;

    constructor(config: Pick<PublishDialogItemListConfig, 'allowOnlyItemRemoval'> = {}) {
        super({
            ...config,
            className: 'publish-dialog-item-list',
        });
    }

    protected initListeners(): void {
        super.initListeners();

        const serverEvents = ContentServerEventsHandler.getInstance();

        const deletedHandler = (deletedItems: ContentServerChangeItem[]) => {
            deletedItems.forEach(deletedItem => {
                this.getItems().forEach(item => {
                    if (item.getContentId().equals(deletedItem.getContentId())) {
                        this.removeItems(item);
                    }
                });
            });
        };

        const updatedHandler = (updatedItems: ContentSummaryAndCompareStatus[]) => {
            const itemsToReplace = updatedItems.filter(updatedItem => {
                return this.getItems().some(item => {
                    const isSameId = item.getContentId().equals(updatedItem.getContentId());
                    return isSameId && item.getContentSummary().getModifiedTime().valueOf() <
                           updatedItem.getContentSummary().getModifiedTime().valueOf();
                });
            });

            if (itemsToReplace.length > 0) {
                this.replaceItems(itemsToReplace);
            }
        };

        this.onAdded(() => {
            serverEvents.onContentUpdated(updatedHandler);
            serverEvents.onContentDeleted(deletedHandler);
        });

        this.onRemoved(() => {
            serverEvents.unContentUpdated(updatedHandler);
            serverEvents.unContentDeleted(deletedHandler);
        });
    }

    setItems(items: ContentSummaryAndCompareStatus[], silent?: boolean): void {
        super.setItems(items, silent);

        this.itemChangedHandler();
    }

    protected createSelectionItem(viewer: ContentSummaryAndCompareStatusViewer,
                                  browseItem: ContentSummaryAndCompareStatus): TogglableStatusSelectionItem {

        const item: TogglableStatusSelectionItem = super.createSelectionItem(viewer, browseItem);
        item.setRemoveButtonClickTooltip(i18n('dialog.publish.itemRequired'));

        item.onItemStateChanged((contentId, enabled) => {

            const exist = ArrayHelper.contains(this.excludeChildrenIds, contentId);
            if (enabled && exist) {
                this.excludeChildrenIds = ArrayHelper.filter(this.excludeChildrenIds, contentId) as ContentId[];
            } else if (!enabled && !exist) {
                this.excludeChildrenIds.push(contentId);
            }
        });

        if (!ArrayHelper.contains(this.excludeChildrenIds, browseItem.getContentId())) {
            this.excludeChildrenIds.push(browseItem.getContentId());
        }

        return item;
    }

    protected isItemRemovable(item: TogglableStatusSelectionItem): boolean {
        return !!this.config.allowOnlyItemRemoval || this.getItemCount() > 1;
    }

    setExcludeChildrenIds(ids: ContentId[]) {
        this.excludeChildrenIds = ids;

        this.getItemViews().forEach(itemView => {
            if (itemView.hasChildrenItems()) {
                itemView.toggleIncludeChildren(!ArrayHelper.contains(this.excludeChildrenIds, itemView.getContentId()), true);
            }
        });

        this.debounceNotifyListChanged();
    }

    getExcludeChildrenIds(): ContentId[] {
        return this.excludeChildrenIds.slice();
    }

    clearExcludeChildrenIds() {
        this.excludeChildrenIds = [];
    }

    getIncludeChildrenIds(): ContentId[] {
        return this.getItemsIds().filter(id => !ArrayHelper.contains(this.excludeChildrenIds, id));
    }

    removeItemsByIds(contentIds: ContentId[]) {
        contentIds.forEach((id: ContentId) => {
            const item: ContentSummaryAndCompareStatus = this.getItem(id.toString());

            if (item) {
                this.removeItems(item, true);
            }
        });
    }
}
