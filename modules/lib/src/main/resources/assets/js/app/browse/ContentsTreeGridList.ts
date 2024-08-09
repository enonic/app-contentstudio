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

    protected newItems: Map<string, ContentSummaryAndCompareStatus> = new Map<string, ContentSummaryAndCompareStatus>();

    private wasShownAndLoaded: boolean = false;

    constructor(params?: TreeListBoxParams<ContentSummaryAndCompareStatus>) {
        super(params);

        this.fetcher = new ContentSummaryAndCompareStatusFetcher();
    }

    protected createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): ContentsTreeGridListElement {
        return new ContentsTreeGridListElement(item, {scrollParent: this.scrollParent, level: this.level, parentList: this});
    }

    protected updateItemView(itemView: ContentsTreeGridListElement, item: ContentSummaryAndCompareStatus) {
        itemView.updateItemView(item);
    }

    protected getItemId(item: ContentSummaryAndCompareStatus): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        this.wasShownAndLoaded = true;

        this.fetch().then((items: ContentSummaryAndCompareStatus[]) => {
            if (items.length > 0) {
                // first remove new items that are now to be added to avoid being shown twice
                items.forEach((item: ContentSummaryAndCompareStatus) => {
                   const itemId = this.getItemId(item);

                    if (this.newItems.has(itemId)) {
                        this.newItems.delete(itemId);
                        this.removeItems([item], true);
                    }
                });

                this.addItems(items);
            }
        }).catch(DefaultErrorHandler.handle);
    }

    private fetch(): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const from: number = this.getItemCount() - this.newItems.size;
        const size: number = ContentsTreeGridList.FETCH_SIZE;
        const parent = this.getParentItem()?.getContentId();
        const order = parent ? null : this.fetcher.createRootChildOrder();

        return this.fetcher.fetchChildren(parent, from, size, order).then((data: ContentResponse<ContentSummaryAndCompareStatus>) => {
            return data.getContents();
        });
    }

    // new items to be shown on top of the list and must be taken into account when fetching new items, or removed on refresh
    addNewItems(items: ContentSummaryAndCompareStatus[]): void {
        if (this.wasShownAndLoaded) {
            items.forEach((item: ContentSummaryAndCompareStatus) => {
                this.newItems.set(this.getItemId(item), item);
            });

            this.addItems(items);
        } else { // if parent didn't have children before then update it to show expand toggle
            (this.options.parentListElement as ContentsTreeGridListElement)?.setContainsChildren(true);
        }
    }

    protected insertItemView(itemView: ContentsTreeGridListElement): void {
        const itemId = this.getItemId(itemView.getItem());

        if (this.newItems.has(itemId)) {
            this.prependChild(itemView);
        } else {
            super.insertItemView(itemView);
        }
    }

    protected removeItemView(item: ContentSummaryAndCompareStatus): void {
        const id: string = this.getItemId(item);
        this.newItems.delete(id);
        super.removeItemView(item);

        if (this.itemViews.size === 0) {
            (this.options.parentListElement as ContentsTreeGridListElement)?.setContainsChildren(false);
        }
    }

    load(): void {
        this.clearItems();
        this.newItems = new Map<string, ContentSummaryAndCompareStatus>();
        this.handleLazyLoad();
    }

    findParentList(item: ContentSummaryAndCompareStatus): TreeListBox<ContentSummaryAndCompareStatus> {
        const itemPath = item.getPath();
        const thisPath = this.getParentItem()?.getPath() || ContentPath.getRoot();

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

    private containsChildren: boolean;

    constructor(content: ContentSummaryAndCompareStatus, params: TreeListElementParams<ContentSummaryAndCompareStatus>) {
        super(content, params);
    }

    protected initElements(): void {
        this.containsChildren = this.item.hasChildren();
        super.initElements();
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
        return this.containsChildren;
    }

    setContainsChildren(value: boolean): void {
        this.containsChildren = value;
        this.updateExpandableState();
    }

    protected createItemViewer(item: ContentSummaryAndCompareStatus): ContentTreeGridListViewer {
        const viewer = new ContentTreeGridListViewer();
        viewer.setItem(item);
        return viewer;
    }

    findParentList(item: ContentSummaryAndCompareStatus): TreeListBox<ContentSummaryAndCompareStatus> {
        return this.childrenList.findParentList(item);
    }

    updateItemView(item: ContentSummaryAndCompareStatus): void {
        (this.itemViewer as ContentTreeGridListViewer).setItem(item);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('content-tree-list-element');

            return rendered;
        });
    }

}
