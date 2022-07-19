import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
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
        return new VersionHistoryListItem(version, this.content);
    }

    getItemId(item: VersionHistoryItem): string {
        return item.getId();
    }

}
