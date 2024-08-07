import Q from 'q';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {TreeListBox, TreeListBoxParams, TreeListElement, TreeListElementParams} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {ContentResponse} from '../resource/ContentResponse';

export class ContentsTreeGridList
    extends TreeListBox<ContentSummaryAndCompareStatus> {

    public static FETCH_SIZE: number = 10;

    protected readonly fetcher: ContentSummaryAndCompareStatusFetcher;

    protected readonly parentItem?: ContentSummaryAndCompareStatus;

    constructor(params?: TreeListBoxParams<ContentSummaryAndCompareStatus>) {
        super(params);

        this.parentItem = params?.parentItem;
        this.fetcher = new ContentSummaryAndCompareStatusFetcher();
    }

    protected createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): ContentListElement {
        return new ContentListElement(item, {scrollParent: this.scrollParent, level: this.level});
    }

    protected getItemId(item: ContentSummaryAndCompareStatus): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        this.fetch().then((items: ContentSummaryAndCompareStatus[]) => {
            if (items.length > 0) {
                this.addItems(items);
            }

        }).catch(DefaultErrorHandler.handle);
    }

    private fetch(): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const from: number = this.getItemCount();
        const size: number = ContentsTreeGridList.FETCH_SIZE;
        const parent = this.parentItem?.getContentId();
        const order = parent ? null : this.fetcher.createRootChildOrder();

        return this.fetcher.fetchChildren(parent, from, size, order).then((data: ContentResponse<ContentSummaryAndCompareStatus>) => {
            return data.getContents();
        });
    }

    load(): void {
        this.clearItems();
        this.handleLazyLoad();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('content-tree-list');

            return rendered;
        });
    }

}

export class ContentListElement extends TreeListElement<ContentSummaryAndCompareStatus> {

    protected childrenList: ContentsTreeGridList;

    constructor(content: ContentSummaryAndCompareStatus, params: TreeListElementParams<ContentSummaryAndCompareStatus>) {
        super(content, params);
    }

    protected createChildrenListParams(): TreeListElementParams<ContentSummaryAndCompareStatus> {
        const params =  super.createChildrenListParams() as TreeListElementParams<ContentSummaryAndCompareStatus>;

        params.parentItem = this.item;

        return params;
    }

    protected createChildrenList(params?: TreeListElementParams<ContentSummaryAndCompareStatus>): ContentsTreeGridList {
        return new ContentsTreeGridList(params);
    }

    hasChildren(): boolean {
        return this.item.hasChildren();
    }

    protected createItemViewer(item: ContentSummaryAndCompareStatus): ContentSummaryAndCompareStatusViewer {
        const viewer = new ContentSummaryAndCompareStatusViewer();
        viewer.setObject(item);
        return viewer;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('content-tree-list-element');

            return rendered;
        });
    }

}
