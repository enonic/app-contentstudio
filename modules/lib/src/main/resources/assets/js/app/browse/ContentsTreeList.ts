import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {TreeListBox, TreeListBoxParams, TreeListElement, TreeListElementParams} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {OptionDataLoaderData} from '@enonic/lib-admin-ui/ui/selector/OptionDataLoader';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import Q from 'q';
import {ContentSummaryOptionDataLoader} from '../inputtype/ui/selector/ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ContentTreeSelectorItemViewer} from '../item/ContentTreeSelectorItemViewer';

export interface ContentsListParams extends TreeListBoxParams<ContentTreeSelectorItem> {
    loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;
}

export class ContentsTreeList
    extends TreeListBox<ContentTreeSelectorItem> {

    public static FETCH_SIZE: number = 10;

    protected readonly loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;

    constructor(params?: ContentsListParams) {
        super(params);

        this.loader = params.loader;
    }

    protected initListeners(): void {
        super.initListeners();

        const responsiveItem: ResponsiveItem = new ResponsiveItem(this);

        const resizeListener = () => {
            responsiveItem.update();
        };

        new ResizeObserver(AppHelper.debounce(resizeListener, 200)).observe(this.getHTMLElement());
    }

    protected createItemView(item: ContentTreeSelectorItem, readOnly: boolean): ContentListElement {
        return new ContentListElement(item, {loader: this.loader, scrollParent: this.scrollParent, parentList: this});
    }

    protected getItemId(item: ContentTreeSelectorItem): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        // if ContentTreeSelectorQueryRequest is used (not really smart mode), then all items are loaded at once
        if (this.loader.isSmartTreeMode()) {
            if (this.getItemCount() === 0 && !this.loader.isLoading()) {
                this.load();
            }
        } else {
            this.load();
        }
    }

    private fetch(): Q.Promise<OptionDataLoaderData<ContentTreeSelectorItem>> {
        const from: number = this.getItemCount();
        const size: number = ContentsTreeList.FETCH_SIZE;

        const data = this.options.parentListElement ? Option.create<ContentTreeSelectorItem>()
            .setValue(this.getParentItem().getId())
            .setDisplayValue(this.getParentItem())
            .build() : null;

        return this.loader.fetchChildren(data, from, size);
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

export interface ContentsListElementParams extends TreeListElementParams<ContentTreeSelectorItem> {
    loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>
}

export class ContentListElement extends TreeListElement<ContentTreeSelectorItem> {

    declare protected readonly options: ContentsListElementParams;

    declare protected childrenList: ContentsTreeList;

    constructor(content: ContentTreeSelectorItem, params: ContentsListElementParams) {
        super(content, params);
    }

    protected createChildrenListParams(): ContentsListParams {
        const params =  super.createChildrenListParams() as ContentsListParams;

        params.loader = this.options.loader;

        return params;
    }

    protected createChildrenList(params?: ContentsListParams): ContentsTreeList {
        return new ContentsTreeList(params);
    }

    hasChildren(): boolean {
        return this.item.hasChildren();
    }

    protected createItemViewer(item: ContentTreeSelectorItem): Element {
        const viewer = new ContentTreeSelectorItemViewer();
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
