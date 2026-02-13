import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {type ContentResponse} from '../../resource/ContentResponse';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentSummaryViewer} from '../../content/ContentSummaryViewer';
import {type ContentId} from '../../content/ContentId';
import {type ChildOrder} from '../../resource/order/ChildOrder';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LiEl} from '@enonic/lib-admin-ui/dom/LiEl';

export class SortContentTreeGrid extends LazyListBox<ContentSummaryAndCompareStatus> {

    static MAX_FETCH_SIZE: number = 30;

    private contentId: ContentId;

    private curChildOrder: ChildOrder;

    private contentFetcher: ContentSummaryAndCompareStatusFetcher;

    private scrollContainer: Element;

    constructor(scrollContainer: Element) {
        super('sort-content-tree-grid');

        this.scrollContainer = scrollContainer;
        this.contentFetcher = new ContentSummaryAndCompareStatusFetcher();
    }

    protected createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): Element {
        const liEl = new LiEl('');
        const viewer = new ContentSummaryViewer();
        viewer.setObject(item.getContentSummary());
        liEl.appendChild(viewer);
        return liEl;
    }

    protected handleLazyLoad(): void {
        const from: number = this.getItemCount();

        this.contentFetcher.fetchChildren(this.contentId, from, SortContentTreeGrid.MAX_FETCH_SIZE, this.curChildOrder).then(
            (data: ContentResponse<ContentSummaryAndCompareStatus>) => {
                const items = data.getContents();

                if (items.length > 0) {
                    this.addItems(items);
                }
            }).catch(DefaultErrorHandler.handle);
    }

    protected getScrollContainer(): Element {
        return this.scrollContainer;
    }

    load(): void {
        this.clearItems();
        this.handleLazyLoad();
    }

    protected getItemId(item: ContentSummaryAndCompareStatus): string {
        return item.getContentId().toString();
    }

    setContentId(value: ContentId) {
        this.contentId = value;
    }

    getChildOrder(): ChildOrder {
        return this.curChildOrder;
    }

    setChildOrder(value: ChildOrder) {
        this.curChildOrder = value;
    }

    reset() {
        this.setChildOrder(null);
        this.clearItems();
    }

}
