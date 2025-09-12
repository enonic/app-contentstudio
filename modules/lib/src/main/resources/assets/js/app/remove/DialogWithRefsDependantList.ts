import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {compareItems, DialogDependantItemsList, ObserverConfig} from '../dialog/DialogDependantItemsList';
import {ContentWithRefsResult} from '../resource/ContentWithRefsResult';
import {ContentItem} from '../ui2/list/ContentItem';
import {EditContentEvent} from '../event/EditContentEvent';

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

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): ContentItem {

        const view = new ContentItem({
            content: item,
            selected: false,
            className: 'archive-item',
            clickable: !readOnly,
            onClick: readOnly ? undefined : () => new EditContentEvent([item]).fire(),
            showReferences: true,
        });

        view.setHasInbound(this.resolveDependenciesResult?.hasInboundDependency(item.getId()) ?? false);
        return view;
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
