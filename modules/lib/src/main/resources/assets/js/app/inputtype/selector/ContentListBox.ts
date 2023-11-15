import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {ContentTreeSelectorItemViewer} from '../../item/ContentTreeSelectorItemViewer';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentAndStatusTreeSelectorItem} from '../../item/ContentAndStatusTreeSelectorItem';
import {ContentAndStatusSelectorViewer} from './ContentAndStatusSelectorViewer';

export interface ContentListBoxOptions {
    loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;
}

export class ContentListBox extends LazyListBox<ContentTreeSelectorItem> {

    private readonly loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;

    constructor(options: ContentListBoxOptions) {
        super('content-list-box');

        this.loader = options.loader;
    }

    protected createItemView(item: ContentAndStatusTreeSelectorItem, readOnly: boolean): ContentAndStatusSelectorViewer {
        const viewer = new ContentAndStatusSelectorViewer();

        viewer.setObject(item);

        return viewer;
    }

    protected getItemId(item: ContentTreeSelectorItem): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        this.loader.load(true).then((items: ContentTreeSelectorItem[]) => {
            this.addItems(items);
        }).catch(DefaultErrorHandler.handle);
    }
}
