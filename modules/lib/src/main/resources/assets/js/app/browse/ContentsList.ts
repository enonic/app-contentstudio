import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentResponse} from '../resource/ContentResponse';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {LiEl} from '@enonic/lib-admin-ui/dom/LiEl';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Checkbox} from '@enonic/lib-admin-ui/ui/Checkbox';
import {ContentTreeView} from './ContentTreeView';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';

export type DataCallback<Data> = (data: Data) => void;
export type SelectionCallback<Data> = (data: Data, state: boolean) => void;

export interface ListParams {
    parentContent?: ContentSummaryAndCompareStatus,
    scrollParent?: Element,
    multiSelect?: boolean,
    level?: number,
}

export class ContentsList
    extends LazyListBox<ContentSummaryAndCompareStatus> {

    private static FETCH_SIZE: number = 10;

    private readonly scrollParent: Element;

    private fetcher: ContentSummaryAndCompareStatusFetcher;

    private readonly parentContent: ContentSummaryAndCompareStatus;

    private itemClickedListeners: DataCallback<ContentSummaryAndCompareStatus>[] = [];

    private selectionChangedListeners: SelectionCallback<ContentSummaryAndCompareStatus>[] = [];

    private readonly multiSelect: boolean;

    private level: number;

    constructor(params?: ListParams) {
        super('contents-list');

        this.scrollParent = params?.scrollParent || this;
        this.fetcher = new ContentSummaryAndCompareStatusFetcher();
        this.parentContent = params?.parentContent;
        this.multiSelect = params?.multiSelect;
        this.level = params?.level ?? 0;
        this.initListeners();
    }

    protected initListeners(): void {
        this.whenShown(() => {
            this.handleLazyLoad();
        });
    }

    protected createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): ContentListElement {
        const itemView: ContentListElement = new ContentListElement(item, this.scrollParent, this.multiSelect, this.level);

        itemView.onItemClicked((data: ContentSummaryAndCompareStatus) => {
            this.notifyItemClicked(data);
        });

        itemView.onSelectionChanged((data: ContentSummaryAndCompareStatus, isSelected: boolean) => {
            this.notifySelectionChanged(data, isSelected);
        });

        return itemView;
    }

    protected getItemId(item: ContentSummaryAndCompareStatus): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        console.log('lazyload');

        this.fetch().then((data: ContentResponse<ContentSummaryAndCompareStatus>) => {
            if (data.getContents().length > 0) {
                this.addItems(data.getContents());
            }
        }).catch(DefaultErrorHandler.handle);
    }

    private fetch(): Q.Promise<ContentResponse<ContentSummaryAndCompareStatus>> {
        const from: number = this.getItemCount();
        const size: number = ContentsList.FETCH_SIZE;

        return this.parentContent ?
               this.fetcher.fetchChildren(this.parentContent?.getContentId(), from, size) :
               this.fetcher.fetchRoot(from, size);
    }

    load(): void {
        this.handleLazyLoad();
    }

    protected getScrollContainer(): Element {
        return this.scrollParent;
    }

    onItemClicked(handler: DataCallback<ContentSummaryAndCompareStatus>): void {
        this.itemClickedListeners.push(handler);
    }

    unItemClicked(handler: DataCallback<ContentSummaryAndCompareStatus>): void {
        this.itemClickedListeners =
            this.itemClickedListeners.filter((listener: DataCallback<ContentSummaryAndCompareStatus>) => listener !== handler);
    }

    private notifyItemClicked(item: ContentSummaryAndCompareStatus): void {
        this.itemClickedListeners.forEach((listener: DataCallback<ContentSummaryAndCompareStatus>) => listener(item));
    }

    onSelectionChanged(handler: SelectionCallback<ContentSummaryAndCompareStatus>): void {
        this.selectionChangedListeners.push(handler);
    }

    unSelectionChanged(handler: SelectionCallback<ContentSummaryAndCompareStatus>): void {
        this.selectionChangedListeners =
            this.selectionChangedListeners.filter((listener: SelectionCallback<ContentSummaryAndCompareStatus>) => listener !== handler);
    }

    private notifySelectionChanged(item: ContentSummaryAndCompareStatus, isSelected: boolean): void {
        this.selectionChangedListeners.forEach((listener: SelectionCallback<ContentSummaryAndCompareStatus>) => listener(item, isSelected));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.toggleClass('multiselect', this.multiSelect);

            if (this.level === 0) {
                ResponsiveManager.onAvailableSizeChanged(this);
            }

            return rendered;
        });
    }
}


export enum ContentListElementState {
    NONE,
    HIGHLIGHTED,
    SELECTED
}

export class ContentListElement
    extends LiEl {

    private elementsWrapper: Element;

    private toggleElement: Element;

    private contentTreeView: ContentTreeView;

    private childrenList: ContentsList;

    private isExpanded: boolean = false;

    private readonly content: ContentSummaryAndCompareStatus;

    private readonly scrollParent: Element;

    private readonly multiSelect: boolean;

    private checkbox?: Checkbox;

    private selectionState: ContentListElementState = ContentListElementState.NONE;

    private readonly level: number;

    constructor(content: ContentSummaryAndCompareStatus, scrollParent: Element, multiSelect: boolean, level: number) {
        super('contents-list-element');

        this.content = content;
        this.scrollParent = scrollParent;
        this.multiSelect = multiSelect;
        this.level = level;
        this.initElements();
        this.initListeners();
    }

    private initElements(): void {
        this.elementsWrapper = new DivEl('wrapper');
        this.toggleElement = new DivEl(`toggle ${this.content.hasChildren() ? 'icon-arrow_drop_up' : ''}`);
        this.contentTreeView = new ContentTreeView();

        if (this.multiSelect) {
            this.checkbox = Checkbox.create().build();
        }

        this.childrenList =
            new ContentsList(
                {parentContent: this.content, scrollParent: this.scrollParent, multiSelect: this.multiSelect, level: this.level + 1});
    }

    private initListeners(): void {
        this.toggleElement.onClicked(() => {
            this.isExpanded = !this.isExpanded;
            this.childrenList.setVisible(this.isExpanded);
            this.toggleElement.toggleClass('expanded', this.isExpanded);
        });
    }

    onItemClicked(listener: DataCallback<ContentSummaryAndCompareStatus>): void {
        this.contentTreeView.onClicked(() => listener(this.content));
        this.childrenList.onItemClicked((item: ContentSummaryAndCompareStatus) => listener(item));
    }

    onSelectionChanged(listener: SelectionCallback<ContentSummaryAndCompareStatus>): void {
        this.checkbox?.onValueChanged(() => {
            listener(this.content, this.checkbox.isChecked());
            this.toggleClass('selected', this.checkbox.isChecked());
        });
        this.childrenList.onSelectionChanged((item: ContentSummaryAndCompareStatus, isSelected: boolean) => listener(item, isSelected));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.childrenList.hide();

            if (this.checkbox) {
                this.checkbox.addClass('selection-checkbox');
                this.appendChild(this.checkbox);
            }

            this.elementsWrapper.appendChildren(this.toggleElement, this.contentTreeView);
            this.elementsWrapper.getEl().setPaddingLeft(`${this.level * 24}px`);
            this.appendChild(this.elementsWrapper);
            this.contentTreeView.setContent(this.content);
            this.appendChild(this.childrenList);

            return rendered;
        });
    }
}
