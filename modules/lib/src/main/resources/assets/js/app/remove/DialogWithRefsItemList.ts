import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ArchiveItemViewer} from '../dialog/ArchiveItemViewer';
import {ArchiveSelectableItem} from '../dialog/ArchiveSelectableItem';
import {DialogMainItemsList} from '../dialog/DialogMainItemsList';
import {ContentAppHelper} from '../wizard/ContentAppHelper';
import {Branch} from '../versioning/Branch';

export interface DialogWithRefsItemListConfig {
    className?: string;
    showDependenciesTarget?: Branch;
}

export class DialogWithRefsItemList
    extends DialogMainItemsList {

    protected showDependenciesTarget: Branch;

    constructor(config?: DialogWithRefsItemListConfig) {
        super(config?.className);

        this.showDependenciesTarget = config?.showDependenciesTarget || Branch.DRAFT;
    }

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
        return new ArchiveSelectableItem(
            {viewer, item, clickable: !ContentAppHelper.isContentWizardUrl(), target: this.showDependenciesTarget});
    }
}
