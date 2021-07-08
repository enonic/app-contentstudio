import {DialogDependantList} from '../dialog/DependantItemsDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ResolveDependenciesResult} from '../resource/ResolveDependenciesResult';

export class DeleteDialogDependantList extends DialogDependantList {

    private resolveDependenciesResult: ResolveDependenciesResult;

    protected sortItems(items: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] {
        return items.sort(this.itemsWithRefsOnTop.bind(this));
    }

    setResolveDependenciesResult(resolveDependenciesResult: ResolveDependenciesResult) {
        this.resolveDependenciesResult = resolveDependenciesResult;
    }

    private itemsWithRefsOnTop(a: ContentSummaryAndCompareStatus, b: ContentSummaryAndCompareStatus): number {
        return this.hasInboundToNumber(b) - this.hasInboundToNumber(a) + DialogDependantList.invalidAndReadOnlyOnTop(a,b);
    }

    private hasInboundToNumber(item: ContentSummaryAndCompareStatus): number {
        return this.resolveDependenciesResult?.hasIncomingDependency(item.getId()) ? 3 : 0;
    }

}
