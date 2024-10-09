import {ContentSummary} from '../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';
import {ContentTreeSelectorDropdown} from './ContentTreeSelectorDropdown';
import {ContentId} from '../../content/ContentId';

export class ImageSelectorDropdown extends ContentTreeSelectorDropdown {

    protected createSelectorItem(content: ContentSummary | ContentSummaryAndCompareStatus, id: ContentId): MediaTreeSelectorItem {
        if (content instanceof ContentSummaryAndCompareStatus) {
            return new MediaTreeSelectorItem(content.getContentSummary());
        }

        const mediaItem = new MediaTreeSelectorItem(content);

        if (mediaItem.isEmptyContent()) {
            mediaItem.setMissingItemId(id?.toString());
        }

        return mediaItem;
    }

}
