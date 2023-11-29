import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import Q from 'q';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentResponse} from '../resource/ContentResponse';
import {TreeListBox, TreeListBoxParams, TreeListElement} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {ContentAndStatusSelectorViewer} from '../inputtype/selector/ContentAndStatusSelectorViewer';
import {ContentAndStatusTreeSelectorItem} from '../item/ContentAndStatusTreeSelectorItem';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ContentSummary} from '../content/ContentSummary';

export interface ContentsListParams extends TreeListBoxParams {
    parentContent?: ContentSummary;
}

export class ContentsTreeList
    extends TreeListBox<ContentTreeSelectorItem> {

    public static FETCH_SIZE: number = 10;

    protected fetcher: ContentSummaryAndCompareStatusFetcher;

    protected readonly parentContent: ContentSummary;

    constructor(params?: ContentsListParams) {
        super(params);

        this.fetcher = new ContentSummaryAndCompareStatusFetcher();
        this.parentContent = params?.parentContent;
    }

    protected createItemView(item: ContentTreeSelectorItem, readOnly: boolean): ContentListElement {
        return new ContentListElement(item, this.scrollParent, this.level);
    }

    protected getItemId(item: ContentTreeSelectorItem): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        this.fetch().then((data: ContentResponse<ContentSummaryAndCompareStatus>) => {
            if (data.getContents().length > 0) {
                this.addItems(data.getContents().map((content) => new ContentAndStatusTreeSelectorItem(content)));
            }
        }).catch(DefaultErrorHandler.handle);
    }

    private fetch(): Q.Promise<ContentResponse<ContentSummaryAndCompareStatus>> {
        const from: number = this.getItemCount();
        const size: number = ContentsTreeList.FETCH_SIZE;

        return this.parentContent ?
               this.fetcher.fetchChildren(this.parentContent?.getContentId(), from, size) :
               this.fetcher.fetchRoot(from, size);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('content-tree-list');

            return rendered;
        });
    }

}

export class ContentListElement extends TreeListElement<ContentTreeSelectorItem> {

    constructor(content: ContentTreeSelectorItem, scrollParent: Element, level: number) {
        super(content, scrollParent, level);
    }

    protected createChildrenListParams(): TreeListBoxParams {
        const params =  super.createChildrenListParams() as ContentsListParams;

        params.parentContent = this.item.getContent();

        return params;
    }

    protected createChildrenList(params?: TreeListBoxParams): ContentsTreeList {
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

            return rendered;
        });
    }

}
