import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ArchiveCheckableItem} from '../dialog/ArchiveCheckableItem';
import {DependantArchiveItemViewer} from '../dialog/DependantArchiveItemViewer';
import {compareItems, DialogDependantItemsList, type ObserverConfig} from '../dialog/DialogDependantItemsList';
import {type ContentWithRefsResult} from '../resource/ContentWithRefsResult';

export class DialogWithRefsDependantList
    extends DialogDependantItemsList {

    private resolveDependenciesResult: ContentWithRefsResult;

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

    setResolveDependenciesResult(resolveDependenciesResult: ContentWithRefsResult) {
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
