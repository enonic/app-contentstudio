import {type NewContentDialogListItem} from './NewContentDialogListItem';
import {RecentItems} from './RecentItems';
import {NewContentDialogList} from './NewContentDialogList';

export class RecentItemsList extends NewContentDialogList {

    constructor() {
        super('recent-content-types-list');
    }

    createItems(items: NewContentDialogListItem[]): number {
        const itemsByName: Record<string, NewContentDialogListItem> = {};
        items.forEach((item: NewContentDialogListItem) => {
            itemsByName[item.getName()] = item;
        });

        const recentItemsNames = RecentItems.get().getRecentItemsNames();
        const recentItems: NewContentDialogListItem[] = [];
        recentItemsNames.forEach((name: string) => {
            if (itemsByName[name]) {
                recentItems.push(itemsByName[name]);
            }
        });

        this.setItems(recentItems);

        return recentItems.length;
    }
}
