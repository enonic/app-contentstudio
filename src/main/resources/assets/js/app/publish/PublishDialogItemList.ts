import {DialogTogglableItemList, TogglableStatusSelectionItem} from '../dialog/DialogTogglableItemList';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {BrowseItem} from 'lib-admin-ui/app/browse/BrowseItem';
import {ArrayHelper} from 'lib-admin-ui/util/ArrayHelper';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';

export class PublishDialogItemList
    extends DialogTogglableItemList {

    private excludeChildrenIds: ContentId[] = [];

    constructor() {
        super(false, 'publish-dialog-item-list');
    }

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): TogglableStatusSelectionItem {
        const view = super.createItemView(item, readOnly);

        const deletedHandler = (changedItems: ContentServerChangeItem[], pending?: boolean) => {
            if (changedItems.some(changedItem => changedItem.getContentId().equals(item.getContentId()))) {
                this.removeItem(item);
            }
        };

        const updatedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            const updatedContent = data.find((d) => d.getContentId().equals(item.getContentId()));
            if (updatedContent) {
                this.replaceItems([updatedContent]);
            }
        };

        const serverEvents = ContentServerEventsHandler.getInstance();

        serverEvents.onContentUpdated(updatedHandler);
        serverEvents.onContentDeleted(deletedHandler);

        view.onRemoved(() => {
            serverEvents.unContentUpdated(updatedHandler);
            serverEvents.unContentDeleted(deletedHandler);
        });

        return view;
    }

    protected createSelectionItem(viewer: ContentSummaryAndCompareStatusViewer,
                                  browseItem: BrowseItem<ContentSummaryAndCompareStatus>): TogglableStatusSelectionItem {

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

        if (!ArrayHelper.contains(this.excludeChildrenIds, browseItem.getModel().getContentId())) {
            this.excludeChildrenIds.push(browseItem.getModel().getContentId());
        }

        return item;
    }

    public setExcludeChildrenIds(ids: ContentId[]) {
        this.excludeChildrenIds = ids;

        this.getItemViews().forEach(itemView => {
            if (itemView.getIncludeChildrenToggler()) {
                itemView.getIncludeChildrenToggler().toggle(!ArrayHelper.contains(this.excludeChildrenIds, itemView.getContentId()), true);
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
