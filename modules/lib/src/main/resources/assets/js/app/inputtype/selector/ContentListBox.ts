import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {ContentTreeSelectorItemViewer} from '../../item/ContentTreeSelectorItemViewer';

export class ContentListBox extends LazyListBox<ContentTreeSelectorItem> {

    constructor() {
        super('content-list-box');
    }

    protected createItemView(item: ContentTreeSelectorItem, readOnly: boolean): ContentTreeSelectorItemViewer {
        const viewer = new ContentTreeSelectorItemViewer();

        viewer.setObject(item);

        return viewer;
    }

    protected getItemId(item: ContentTreeSelectorItem): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        console.log('handleLazyLoad');
    }
}
