import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentAndStatusSelectorViewer} from './ContentAndStatusSelectorViewer';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export interface ContentListBoxOptions<T extends ContentTreeSelectorItem> {
    loader: ContentSummaryOptionDataLoader<T>;
    className?: string;
}

export class ContentListBox<T extends ContentTreeSelectorItem> extends LazyListBox<T> {

    private readonly loader: ContentSummaryOptionDataLoader<T>;

    constructor(options: ContentListBoxOptions<T>) {
        super('content-list-box ' + (options.className || ''));

        this.loader = options.loader;
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
}
