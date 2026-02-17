import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {type ContentSummary} from '../../../../../content/ContentSummary';
import {ContentSummaryViewer} from '../../../../../content/ContentSummaryViewer';
import {type FragmentContentSummaryLoader} from './FragmentContentSummaryLoader';

export class FragmentDropdownList extends LazyListBox<ContentSummary> {

    private loader: FragmentContentSummaryLoader;

    constructor() {
        super('common-page-list-box');
    }

    setLoader(loader: FragmentContentSummaryLoader): this {
        this.loader = loader;
        return this;
    }

    protected createItemView(item: ContentSummary, readOnly: boolean): ContentSummaryViewer {
        const viewer = new ContentSummaryViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: ContentSummary): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        this.loader.postLoad();
    }

}
