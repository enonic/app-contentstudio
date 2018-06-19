import {DialogTogglableItemList, TogglableStatusSelectionItem} from '../dialog/DialogTogglableItemList';
import ContentSummaryAndCompareStatusViewer = api.content.ContentSummaryAndCompareStatusViewer;
import BrowseItem = api.app.browse.BrowseItem;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import ArrayHelper = api.util.ArrayHelper;
import i18n = api.util.i18n;

export class PublishDialogItemList
    extends DialogTogglableItemList {

    private excludeChildrenIds: ContentId[] = [];
    constructor() {
        super(false, 'publish-dialog-item-list');
    }

    protected createSelectionItem(viewer: ContentSummaryAndCompareStatusViewer,
                                  browseItem: BrowseItem<ContentSummaryAndCompareStatus>): TogglableStatusSelectionItem {

        const item = super.createSelectionItem(viewer, browseItem);
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
}
