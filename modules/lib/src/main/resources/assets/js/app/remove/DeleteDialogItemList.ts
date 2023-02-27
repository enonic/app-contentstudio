import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ArchiveItemViewer} from '../dialog/ArchiveItemViewer';
import {ArchiveSelectableItem} from '../dialog/ArchiveSelectableItem';
import {DialogMainItemsList} from '../dialog/DialogMainItemsList';
import {ContentAppHelper} from '../wizard/ContentAppHelper';

export class DeleteDialogItemList
    extends DialogMainItemsList {

    getItemView(item: ContentSummaryAndCompareStatus): ArchiveSelectableItem {
        return super.getItemView(item) as ArchiveSelectableItem;
    }

    getItemViews(): ArchiveSelectableItem[] {
        return this.getItems().map((item) => this.getItemView(item));
    }

    protected createItemViewer(): ArchiveItemViewer {
        return new ArchiveItemViewer();
    }

    protected createSelectionItem(viewer: ArchiveItemViewer, item: ContentSummaryAndCompareStatus): ArchiveSelectableItem {
        return new ArchiveSelectableItem({viewer, item, clickable: !ContentAppHelper.isContentWizardUrl()});
    }
}
