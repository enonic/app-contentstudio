import {ContentListBox, ContentListBoxOptions} from './ContentListBox';
import {ImageSelectorViewer} from '../ui/selector/image/ImageSelectorViewer';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class ImageContentListBox extends ContentListBox<MediaTreeSelectorItem> {

    constructor(options: ContentListBoxOptions<MediaTreeSelectorItem>) {
        options.className = `${(options.className || '')} gallery-list-box`;
        super(options);
    }

    protected createItemView(item: MediaTreeSelectorItem, readOnly: boolean): ImageSelectorViewer {
        const viewer = new ImageSelectorViewer();

        viewer.setObject(item);

        return viewer;
    }

    protected updateItemView(itemView: Element, item: MediaTreeSelectorItem): void {
        const viewer = itemView as ImageSelectorViewer;
        viewer.setObject(item);
    }
}
