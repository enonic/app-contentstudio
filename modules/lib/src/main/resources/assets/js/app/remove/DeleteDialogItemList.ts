import {DialogItemList} from '../dialog/DependantItemsDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ArchiveItem} from '../dialog/ArchiveItem';
import {ArchiveItemViewer} from '../dialog/ArchiveItemViewer';
import {ContentAppHelper} from '../wizard/ContentAppHelper';

export class DeleteDialogItemList
    extends DialogItemList {

    getItemView(item: ContentSummaryAndCompareStatus): ArchiveItem {
        return <ArchiveItem>super.getItemView(item);
    }

    getItemViews(): ArchiveItem[] {
        return this.getItems().map((item) => this.getItemView(item));
    }

    protected createItemViewer(): ArchiveItemViewer {
        return new ArchiveItemViewer();
    }

    protected createSelectionItem(viewer: ArchiveItemViewer, item: ContentSummaryAndCompareStatus): ArchiveItem {
        return new ArchiveItem({viewer, item, clickable: !ContentAppHelper.isContentWizardUrl()});
    }
}
