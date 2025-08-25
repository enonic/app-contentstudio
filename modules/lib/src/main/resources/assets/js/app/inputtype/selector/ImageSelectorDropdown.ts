import {ContentId} from '../../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';
import {SelectedContentItem} from './ContentSelectorDropdown';
import {ContentTreeSelectorDropdown} from './ContentTreeSelectorDropdown';

export class ImageSelectorDropdown extends ContentTreeSelectorDropdown {

    protected createPreselectedItem(selectedContentItem: SelectedContentItem): MediaTreeSelectorItem {
        const contentOrId = selectedContentItem.item;
        const cs = contentOrId instanceof ContentId ? ContentSummaryAndCompareStatus.fromId(contentOrId) : contentOrId;

        return MediaTreeSelectorItem.create().setContent(cs).setAvailabilityStatus(selectedContentItem.status).build();
    }

}
