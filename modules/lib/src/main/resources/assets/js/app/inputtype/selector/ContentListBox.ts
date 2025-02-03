import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentAndStatusSelectorViewer} from './ContentAndStatusSelectorViewer';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';

export interface ContentListBoxOptions<T extends ContentTreeSelectorItem> {
    loader: ContentSummaryOptionDataLoader<T>;
    className?: string;
}

export class ContentListBox<T extends ContentTreeSelectorItem> extends LazyListBox<T> {

    private readonly loader: ContentSummaryOptionDataLoader<T>;


    constructor(options: ContentListBoxOptions<T>) {
        super('content-list-box ' + (options.className || ''));

        this.loader = options.loader;
        this.initListeners();
    }

    protected createItemView(item: T, readOnly: boolean): Element {
        const viewer = new ContentAndStatusSelectorViewer();

        viewer.setObject(item);

        return viewer;
    }

    protected getItemId(item: ContentTreeSelectorItem): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        this.loader.load(true).catch(DefaultErrorHandler.handle);
    }

    protected updateItemView(itemView: Element, item: T) {
        const viewer = itemView as ContentAndStatusSelectorViewer;
        viewer.setObject(item);
    }

    protected initListeners(): void {
        const responsiveItem: ResponsiveItem = new ResponsiveItem(this);

        const resizeListener = () => {
            responsiveItem.update();
        };

        new ResizeObserver(AppHelper.debounce(resizeListener, 200)).observe(this.getHTMLElement());
    }
}
