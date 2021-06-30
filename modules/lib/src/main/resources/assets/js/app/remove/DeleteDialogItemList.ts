import {DialogItemList} from '../dialog/DependantItemsDialog';
import {StatusSelectionItem} from '../dialog/StatusSelectionItem';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class DeleteDialogItemList
    extends DialogItemList {

    getItemView(item: ContentSummaryAndCompareStatus): StatusSelectionItem {
        return <StatusSelectionItem>super.getItemView(item);
    }

    getItemViews(): StatusSelectionItem[] {
        return this.getItems().map((item) => this.getItemView(item));
    }
}
