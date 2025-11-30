import {ContentItemElement} from '../../v6/features/shared/items/ContentItem';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {compareItems, DialogDependantItemsList, ObserverConfig} from '../dialog/DialogDependantItemsList';
import {EditContentEvent} from '../event/EditContentEvent';
import {ContentWithRefsResult} from '../resource/ContentWithRefsResult';

export class DialogWithRefsDependantList
    extends DialogDependantItemsList<ContentItemElement> {
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

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): ContentItemElement {
        return new ContentItemElement({
            content: item,
            selected: false,
            className: 'archive-item',
            onClick: readOnly ? undefined : () => new EditContentEvent([item]).fire(),
            children: undefined,
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
