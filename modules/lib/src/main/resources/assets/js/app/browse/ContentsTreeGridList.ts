import Q from 'q';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {TreeListBox, TreeListBoxParams, TreeListElement, TreeListElementParams} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentResponse} from '../resource/ContentResponse';
import {ContentPath} from '../content/ContentPath';
import {ContentTreeGridListViewer} from './ContentTreeGridListViewer';

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

    protected createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): ContentsTreeGridListElement {
        return new ContentsTreeGridListElement(item, {scrollParent: this.scrollParent, level: this.level, parentList: this});
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

    findParentList(item: ContentSummaryAndCompareStatus): TreeListBox<ContentSummaryAndCompareStatus> {
        const itemPath = item.getPath();
        const thisPath = this.options.parentItem?.getPath() || ContentPath.getRoot();

        if (itemPath.isDescendantOf(thisPath)) {
            if (itemPath.isChildOf(thisPath)) {
                return this;
            }

            let ancestor = null;

            this.getItemViews().some((listElement: ContentsTreeGridListElement) => {
                ancestor = listElement.findParentList(item);
                return !!ancestor;
            });

            return ancestor;
        }

        return null;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('content-tree-grid-list');

            return rendered;
        });
    }

}

export class ContentsTreeGridListElement extends TreeListElement<ContentSummaryAndCompareStatus> {

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

    protected createItemViewer(item: ContentSummaryAndCompareStatus): ContentTreeGridListViewer {
        const viewer = new ContentTreeGridListViewer();
        viewer.setItem(item);
        return viewer;
    }

    findParentList(item: ContentSummaryAndCompareStatus): TreeListBox<ContentSummaryAndCompareStatus> {
        return this.childrenList.findParentList(item);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('content-tree-list-element');

            return rendered;
        });
    }

}
