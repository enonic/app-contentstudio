import {ContentSelectorDropdown} from './ContentSelectorDropdown';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';

export class ImageSelectorDropdown extends ContentSelectorDropdown {

    protected createSelectorItem(content: ContentSummary | ContentSummaryAndCompareStatus): MediaTreeSelectorItem {
        if (content instanceof ContentSummaryAndCompareStatus) {
            return new MediaTreeSelectorItem(content.getContentSummary());
        }

        return new MediaTreeSelectorItem(content);
    }

}
