import {ContentListBox, ContentListBoxOptions} from './ContentListBox';
import {ImageSelectorViewer} from '../ui/selector/image/ImageSelectorViewer';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';

export class ImageContentListBox extends ContentListBox<MediaTreeSelectorItem> {

    constructor(options: ContentListBoxOptions<MediaTreeSelectorItem>) {
        options.className = (options.className || '') + ' image-content-list-box';
        super(options);
    }

    protected createItemView(item: MediaTreeSelectorItem, readOnly: boolean): ImageSelectorViewer {
        const viewer = new ImageSelectorViewer();

        viewer.setObject(item);

        return viewer;
    }

}
