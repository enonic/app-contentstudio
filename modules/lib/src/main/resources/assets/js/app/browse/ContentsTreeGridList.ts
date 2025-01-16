import Q from 'q';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {TreeListBox, TreeListBoxParams, TreeListElement, TreeListElementParams} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentResponse} from '../resource/ContentResponse';
import {ContentPath} from '../content/ContentPath';
import {ContentTreeGridListViewer} from './ContentTreeGridListViewer';
import {ChildOrder} from '../resource/order/ChildOrder';

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

    protected getItemId(item: ContentSummaryAndCompareStatus): string {
        return item.getUploadItem() ? item.getUploadItem().getId() : item.getId();
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
        return this.isRootList() ? this.fetchRootItems() : this.fetchItems();
    }

    protected isRootList(): boolean {
        return !this.getParentItem();
    }

    protected fetchRootItems(): Q.Promise<ContentSummaryAndCompareStatus[]> {
        return this.fetchItems(this.fetcher.createRootChildOrder());
    }

    protected fetchItems(order?: ChildOrder): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const from: number = this.getItemCount() - this.newItems.size;
        const size: number = ContentsTreeGridList.FETCH_SIZE;
        const parent = this.getParentItem()?.getContentId();

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

    protected addItemView(item: ContentSummaryAndCompareStatus, readOnly?: boolean,
                          index?: number): TreeListElement<ContentSummaryAndCompareStatus> {
        (this.options.parentListElement as ContentsTreeGridListElement)?.setContainsChildren(true);
        return super.addItemView(item, readOnly, index);
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
        this.clearItems(true);
        this.newItems = new Map<string, ContentSummaryAndCompareStatus>();
        this.handleLazyLoad();
    }

    wasAlreadyShownAndLoaded(): boolean {
        return this.wasShownAndLoaded;
    }

    findParentLists(item: ContentSummaryAndCompareStatus | ContentPath): ContentsTreeGridList[] {
        const parents: ContentsTreeGridList[] = [];
        const itemPath = item instanceof  ContentSummaryAndCompareStatus ? item.getPath() : item;
        const thisPath = this.getParentItem()?.getPath() || ContentPath.getRoot();

        if (itemPath.isDescendantOf(thisPath)) {
            // if the list is filtered then root may contain the item no matter what path is
            if (itemPath.isChildOf(thisPath) || this.getItems().some(i => i.getPath().equals(itemPath))) {
                parents.push(this);
            }

            this.getItemViews().forEach((listElement: ContentsTreeGridListElement) => {
                const moreParents = listElement.findParentLists(item);

                if (moreParents.length > 0) {
                    parents.push(...moreParents);
                }
            });
        }

        return parents;
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

    findParentLists(item: ContentSummaryAndCompareStatus | ContentPath): ContentsTreeGridList[] {
        return this.childrenList.findParentLists(item);
    }

    setItem(item: ContentSummaryAndCompareStatus): void {
        super.setItem(item);
        (this.itemViewer as ContentTreeGridListViewer).setItem(item);
        this.containsChildren = this.item.hasChildren();
        this.updateExpandableState();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('content-tree-list-element');

            return rendered;
        });
    }

}
