import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {VersionHistoryHelper} from './VersionHistoryHelper';
import {VersionHistoryListItem} from './VersionHistoryListItem';
import {VersionHistoryItem} from './VersionHistoryItem';

export class VersionHistoryList
    extends ListBox<VersionHistoryItem> {

    private content: ContentSummaryAndCompareStatus;

    constructor() {
        super('version-list');
    }

    setContent(content: ContentSummaryAndCompareStatus): void {
        this.content = content;
    }

    createItemView(version: VersionHistoryItem): VersionHistoryListItem {
        return new VersionHistoryListItem(version, this.content, this.hasComparableItemAfter(version));
    }

    getItemId(item: VersionHistoryItem): string {
        return item.getId();
    }

    private hasComparableItemAfter(version: VersionHistoryItem): boolean {
        const versionItemIndex = this.getItems().indexOf(version);

        if (versionItemIndex < 0) {
            return false;
        }

        const itemsAfter = this.getItems().slice(versionItemIndex + 1);

        return itemsAfter.some(v => VersionHistoryHelper.isComparableItem(v));
    }
}
