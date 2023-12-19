import Q from 'q';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {TreeListBox, TreeListBoxParams, TreeListElement} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {ContentAndStatusSelectorViewer} from '../inputtype/selector/ContentAndStatusSelectorViewer';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ContentSummaryOptionDataLoader} from '../inputtype/ui/selector/ContentSummaryOptionDataLoader';
import {OptionDataLoaderData} from '@enonic/lib-admin-ui/ui/selector/OptionDataLoader';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {TreeNode, TreeNodeBuilder} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';

export interface ContentsListParams extends TreeListBoxParams {
    parentItem?: ContentTreeSelectorItem;
}

export class ContentsTreeList
    extends TreeListBox<ContentTreeSelectorItem> {

    public static FETCH_SIZE: number = 10;

    protected loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;

    protected readonly parentItem: ContentTreeSelectorItem;

    constructor(params?: ContentsListParams) {
        super(params);

        this.parentItem = params?.parentItem;
    }

    setLoader(loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>): ContentsTreeList {
        this.loader = loader;
        return this;
    }

    protected createItemView(item: ContentTreeSelectorItem, readOnly: boolean): ContentListElement {
        return new ContentListElement(item, this.loader, this.scrollParent, this.level);
    }

    protected getItemId(item: ContentTreeSelectorItem): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        if (this.getItemCount() === 0 && !this.loader.isLoading()) {
            this.load();
        }
    }

    private fetch(): Q.Promise<OptionDataLoaderData<ContentTreeSelectorItem>> {
        const from: number = this.getItemCount();
        const size: number = ContentsTreeList.FETCH_SIZE;

        const data = this.parentItem ? Option.create<ContentTreeSelectorItem>()
            .setValue(this.parentItem.getId())
            .setDisplayValue(this.parentItem)
            .build() : null;

        const node = new TreeNodeBuilder()
            .setData(data)
            .build() as TreeNode<Option<ContentTreeSelectorItem>>;

        return this.loader.fetchChildren(node, from, size);
    }

    load(): void {
        this.fetch().then((data: OptionDataLoaderData<ContentTreeSelectorItem>) => {
            if (data.getHits() > 0) {
                this.addItems(data.getData());
            }
        }).catch(DefaultErrorHandler.handle);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('content-tree-list');

            return rendered;
        });
    }

}

export class ContentListElement extends TreeListElement<ContentTreeSelectorItem> {

    protected childrenList: ContentsTreeList;

    constructor(content: ContentTreeSelectorItem, loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>, scrollParent: Element,
                level: number) {
        super(content, scrollParent, level);

        this.childrenList.setLoader(loader);
    }

    protected createChildrenListParams(): TreeListBoxParams {
        const params =  super.createChildrenListParams() as ContentsListParams;

        params.parentItem = this.item;

        return params;
    }

    protected createChildrenList(params?: ContentsListParams): ContentsTreeList {
        return new ContentsTreeList(params);
    }

    protected hasChildren(item: ContentTreeSelectorItem): boolean {
        return item.hasChildren();
    }

    protected createItemViewer(item: ContentTreeSelectorItem): Element {
        const viewer = new ContentAndStatusSelectorViewer();
        viewer.setObject(item);
        return viewer;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('content-tree-list-element');
            this.toggleClass('non-selectable', !this.item.isSelectable());

            return rendered;
        });
    }

}
