import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {DialogMainItemsList} from './DialogMainItemsList';
import {TogglableStatusSelectionItem} from './TogglableStatusSelectionItem';

export type ChildrenListChangedListener = (childrenRemoved?: boolean) => void;

export interface DialogTogglableItemListConfig {
    className?: string;
    togglerEnabled?: boolean;
}

export class DialogTogglableItemList
    extends DialogMainItemsList {

    private canBeEmpty: boolean = false;

    private childrenListChangedListeners: ChildrenListChangedListener[] = [];

    private listChangedListeners: (() => void)[] = [];

    protected readonly config: DialogTogglableItemListConfig;

    protected debounceNotifyListChanged: ChildrenListChangedListener;

    constructor(config: DialogTogglableItemListConfig) {
        super(`dialog-togglable-item-list ${config.className ?? ''}`);

        this.config = config;

        const changeHandler = () => {
            this.itemChangedHandler();
        };
        this.onItemsAdded(changeHandler);
        this.onItemsRemoved(changeHandler);

        this.debounceNotifyListChanged = AppHelper.debounce((childrenRemoved?: boolean) => {
            this.notifyChildrenListChanged(childrenRemoved);
        }, 100, false);
    }

    protected initListeners(): void {
        super.initListeners();

        const serverEvents = ContentServerEventsHandler.getInstance();

        const itemsByIdsUpdatedHandler = (updatedItems: ContentSummaryAndCompareStatus[]): void => {
            const updatedIds = updatedItems.map(item => item.getId());
            const isItemsUpdated = this.getItems().some(item => updatedIds.findIndex(updatedId => updatedId === item.getId()) > -1);

            if (isItemsUpdated) {
                this.notifyListChanged();
            }
        };

        const itemsUpdatedHandler = (updatedItems: ContentSummaryAndCompareStatus[]) => {
            itemsByIdsUpdatedHandler(updatedItems);
        };

        const deletedHandler = (deletedItems: ContentServerChangeItem[]) => {
            const isItemsDeleted = deletedItems.some(deletedItem => {
                return this.getItems().forEach(item => item.getContentId().equals(deletedItem.getContentId()));
            });

            if (isItemsDeleted) {
                this.notifyListChanged();
            }
        };

        this.onAdded(() => {
            serverEvents.onContentPermissionsUpdated(itemsByIdsUpdatedHandler);
            serverEvents.onContentUpdated(itemsUpdatedHandler);
            serverEvents.onContentDeleted(deletedHandler);
        });

        this.onRemoved(() => {
            serverEvents.unContentPermissionsUpdated(itemsByIdsUpdatedHandler);
            serverEvents.unContentUpdated(itemsUpdatedHandler);
            serverEvents.unContentDeleted(deletedHandler);
        });
    }

    public setContainsToggleable(value: boolean) {
        this.toggleClass('contains-toggleable', value);
    }

    public setCanBeEmpty(value: boolean) {
        this.canBeEmpty = value;
    }

    private itemChangedHandler(): void {
        const isToggleable = this.getItemViews().some(item => {
            return (item.getBrowseItem() as ContentSummaryAndCompareStatus).getContentSummary().hasChildren();
        });
        this.toggleClass('contains-toggleable', isToggleable);

        this.getItemViews().forEach(view => {
            this.updateRemovableState(view);
        });
    }

    protected updateItemView(itemView: Element, item: ContentSummaryAndCompareStatus): void {
        (itemView as TogglableStatusSelectionItem).setObject(item);
    }

    protected createSelectionItem(viewer: ContentSummaryAndCompareStatusViewer,
                                  browseItem: ContentSummaryAndCompareStatus): TogglableStatusSelectionItem {

        const item = new TogglableStatusSelectionItem(viewer, browseItem);

        if (item.hasChildrenItems()) {
            item.toggleIncludeChildren(!!this.config.togglerEnabled, true);
        }

        item.onItemStateChanged((itemId: ContentId, enabled: boolean) => {
            this.debounceNotifyListChanged(!enabled);
        });

        return item;
    }

    public hasActiveTogglers(): boolean {
        return this.getItemViews().some((itemView: TogglableStatusSelectionItem) => !!itemView.includesChildren());
    }

    public refreshList(): void {
        super.refreshList();
        this.debounceNotifyListChanged();
    }

    public setReadOnly(value: boolean): void {
        super.setReadOnly(value);

        this.getItemViews().forEach((item: TogglableStatusSelectionItem) => {
            item.setReadOnly(value);
        });
    }

    public getItemViews(): TogglableStatusSelectionItem[] {
        return super.getItemViews() as TogglableStatusSelectionItem[];
    }

    public getItemViewById(contentId: ContentId): TogglableStatusSelectionItem {
        for (const view of this.getItemViews()) {
            if (view.getContentId().equals(contentId)) {
                return view;
            }
        }
    }

    private updateRemovableState(view: TogglableStatusSelectionItem): void {
        view.toggleClass('removable', view.isRemovable());
    }

    onChildrenListChanged(listener: ChildrenListChangedListener): void {
        this.childrenListChangedListeners.push(listener);
    }

    unChildrenListChanged(listener: ChildrenListChangedListener): void {
        this.childrenListChangedListeners = this.childrenListChangedListeners.filter((current) => {
            return current !== listener;
        });
    }

    private notifyChildrenListChanged(childrenRemoved?: boolean): void {
        this.childrenListChangedListeners.forEach((listener) => {
            listener(childrenRemoved);
        });
    }

    onListChanged(listener: () => void): void {
        this.listChangedListeners.push(listener);
    }

    unListChanged(listener: () => void): void {
        this.listChangedListeners = this.listChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyListChanged(): void {
        this.listChangedListeners.forEach(listener => {
            listener();
        });
    }
}
