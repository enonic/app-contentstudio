import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {compareItems, DialogDependantItemsList, ObserverConfig} from '../dialog/DialogDependantItemsList';
import {EditContentEvent} from '../event/EditContentEvent';
import {ContentWithRefsResult} from '../resource/ContentWithRefsResult';
import {ContentItem} from '../ui2/list/ContentItem';

export class DialogWithRefsDependantList
    extends DialogDependantItemsList<ContentItem> {
    private resolveDependenciesResult: ContentWithRefsResult;

    constructor(observer: Omit<ObserverConfig, 'sort'>) {
        const className = 'gap-y-1.5';
        super({
            observer: {
                ...observer,
                sort: (items) => [...items].sort((a, b) => this.itemsWithRefsOnTop(a, b)),
            },
            className,
        });
    }

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): ContentItem {
        const hasInbound = !!this.resolveDependenciesResult?.hasInboundDependency(item.getId());

        return new ContentItem({
            content: item,
            selected: false,
            className: 'archive-item',
            clickable: !readOnly,
            onClick: readOnly ? undefined : () => new EditContentEvent([item]).fire(),
            showReferences: true,
            hasInbound,
        });
    }

    setResolveDependenciesResult(resolveDependenciesResult: ContentWithRefsResult) {
        this.resolveDependenciesResult = resolveDependenciesResult;
    }

    private itemsWithRefsOnTop(a: ContentSummaryAndCompareStatus, b: ContentSummaryAndCompareStatus): number {
        return this.hasInboundToNumber(b) - this.hasInboundToNumber(a) + compareItems(a, b);
    }

    private hasInboundToNumber(item: ContentSummaryAndCompareStatus): number {
        return this.resolveDependenciesResult?.hasInboundDependency(item.getId()) ? 3 : 0;
    }
}
