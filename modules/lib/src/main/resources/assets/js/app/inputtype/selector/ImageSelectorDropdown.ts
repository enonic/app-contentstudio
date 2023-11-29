import {ContentSummary} from '../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';
import {ContentSelectorTreeDropdown} from './ContentSelectorTreeDropdown';

export class ImageSelectorDropdown extends ContentSelectorTreeDropdown {

    protected createSelectorItem(content: ContentSummary | ContentSummaryAndCompareStatus): MediaTreeSelectorItem {
        if (content instanceof ContentSummaryAndCompareStatus) {
            return new MediaTreeSelectorItem(content.getContentSummary());
        }

        return new MediaTreeSelectorItem(content);
    }

}
