import {DialogDependantList} from '../dialog/DependantItemsDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ResolveContentForDeleteResult} from '../resource/ResolveContentForDeleteResult';
import {DependantArchiveItemViewer} from '../dialog/DependantArchiveItemViewer';
import {ArchiveItem} from '../dialog/ArchiveItem';

export class DeleteDialogDependantList
    extends DialogDependantList {

    private resolveDependenciesResult: ResolveContentForDeleteResult;

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): ArchiveItem {

        const viewer = new DependantArchiveItemViewer();
        viewer.setObject(item);

        return new ArchiveItem({viewer, item});
    }

    setResolveDependenciesResult(resolveDependenciesResult: ResolveContentForDeleteResult) {
        this.resolveDependenciesResult = resolveDependenciesResult;
    }

    getItemViews(): ArchiveItem[] {
        return super.getItemViews() as ArchiveItem[];
    }

    protected sortItems(items: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] {
        return items.sort(this.itemsWithRefsOnTop.bind(this));
    }

    private itemsWithRefsOnTop(a: ContentSummaryAndCompareStatus, b: ContentSummaryAndCompareStatus): number {
        return this.hasInboundToNumber(b) - this.hasInboundToNumber(a) + DialogDependantList.invalidAndReadOnlyOnTop(a, b);
    }

    private hasInboundToNumber(item: ContentSummaryAndCompareStatus): number {
        return this.resolveDependenciesResult?.hasInboundDependency(item.getId()) ? 3 : 0;
    }

}
