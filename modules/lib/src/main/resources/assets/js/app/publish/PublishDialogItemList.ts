import {ArrayHelper} from '@enonic/lib-admin-ui/util/ArrayHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {DialogTogglableItemList} from '../dialog/DialogTogglableItemList';
import {TogglableStatusSelectionItem} from '../dialog/TogglableStatusSelectionItem';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';

export class PublishDialogItemList
    extends DialogTogglableItemList {

    private excludeChildrenIds: ContentId[] = [];

    constructor() {
        super({className: 'publish-dialog-item-list'});
    }

    protected initListeners(): void {
        super.initListeners();

        const serverEvents = ContentServerEventsHandler.getInstance();

        const deletedHandler = (deletedItems: ContentServerChangeItem[]) => {
            deletedItems.forEach(deletedItem => {
                this.getItems().forEach(item => {
                    if (item.getContentId().equals(deletedItem.getContentId())) {
                        this.removeItem(item);
                    }
                });
            });
        };

        const updatedHandler = (updatedItems: ContentSummaryAndCompareStatus[]) => {
            const itemsToReplace = updatedItems.filter(updatedItem => {
                return this.getItems().some(item => item.getContentId().equals(updatedItem.getContentId()));
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

    protected createSelectionItem(viewer: ContentSummaryAndCompareStatusViewer,
                                  browseItem: ContentSummaryAndCompareStatus): TogglableStatusSelectionItem {

        const item: TogglableStatusSelectionItem = super.createSelectionItem(viewer, browseItem);
        item.setRemoveButtonClickTooltip(i18n('dialog.publish.itemRequired'));

        item.onItemStateChanged((contentId, enabled) => {

            const exist = ArrayHelper.contains(this.excludeChildrenIds, contentId);
            if (enabled && exist) {
                this.excludeChildrenIds = <ContentId[]>ArrayHelper.filter(this.excludeChildrenIds, contentId);
            } else if (!enabled && !exist) {
                this.excludeChildrenIds.push(contentId);
            }
        });

        if (!ArrayHelper.contains(this.excludeChildrenIds, browseItem.getContentId())) {
            this.excludeChildrenIds.push(browseItem.getContentId());
        }

        return item;
    }

    public setExcludeChildrenIds(ids: ContentId[]) {
        this.excludeChildrenIds = ids;

        this.getItemViews().forEach(itemView => {
            if (itemView.hasChildrenItems()) {
                itemView.toggleIncludeChildren(!ArrayHelper.contains(this.excludeChildrenIds, itemView.getContentId()), true);
            }
        });

        this.debounceNotifyListChanged();
    }

    public getExcludeChildrenIds(): ContentId[] {
        return this.excludeChildrenIds.slice();
    }

    public clearExcludeChildrenIds() {
        this.excludeChildrenIds = [];
    }

    removeItemsByIds(contentIds: ContentId[]) {
        contentIds.forEach((id: ContentId) => {
           const item: ContentSummaryAndCompareStatus = this.getItem(id.toString());

            if (item) {
                this.removeItem(item, true);
            }
        });
    }
}
