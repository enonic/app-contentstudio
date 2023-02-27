import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ArchiveCheckableItem} from '../dialog/ArchiveCheckableItem';
import {DependantArchiveItemViewer} from '../dialog/DependantArchiveItemViewer';
import {compareItems, DialogDependantItemsList, ObserverConfig} from '../dialog/DialogDependantItemsList';
import {ResolveContentForDeleteResult} from '../resource/ResolveContentForDeleteResult';

export class DeleteDialogDependantList
    extends DialogDependantItemsList {

    private resolveDependenciesResult: ResolveContentForDeleteResult;

    constructor(observer: Omit<ObserverConfig, 'sort'>) {
        super({
            observer: {
                ...observer,
                sort: (items) => [...items].sort((a, b) => this.itemsWithRefsOnTop(a, b)),
            },
        });
    }

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): ArchiveCheckableItem {
        const viewer = new DependantArchiveItemViewer();
        viewer.setObject(item);
        return new ArchiveCheckableItem({viewer, item});
    }

    setResolveDependenciesResult(resolveDependenciesResult: ResolveContentForDeleteResult) {
        this.resolveDependenciesResult = resolveDependenciesResult;
    }

    getItemViews(): ArchiveCheckableItem[] {
        return super.getItemViews() as ArchiveCheckableItem[];
    }

    private itemsWithRefsOnTop(a: ContentSummaryAndCompareStatus, b: ContentSummaryAndCompareStatus): number {
        return this.hasInboundToNumber(b) - this.hasInboundToNumber(a) + compareItems(a, b);
    }

    private hasInboundToNumber(item: ContentSummaryAndCompareStatus): number {
        return this.resolveDependenciesResult?.hasInboundDependency(item.getId()) ? 3 : 0;
    }

}
