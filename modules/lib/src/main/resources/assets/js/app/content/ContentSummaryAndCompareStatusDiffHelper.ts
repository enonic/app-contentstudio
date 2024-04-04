import {ContentSummaryAndCompareStatus} from './ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusDiff} from './ContentSummaryAndCompareStatusDiff';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class ContentSummaryAndCompareStatusDiffHelper {

    public static diff(item1: ContentSummaryAndCompareStatus, item2: ContentSummaryAndCompareStatus): ContentSummaryAndCompareStatusDiff {
        const diff: ContentSummaryAndCompareStatusDiff = {
            uploadItem: false,
            contentSummary: false,
            compareStatus: false,
            renderable: false
        };

        if (!ObjectHelper.equals(item1.getUploadItem(), item2.getUploadItem())) {
            diff.uploadItem = true;
        }

        if (!ObjectHelper.equals(item1.getContentSummary(), item2.getContentSummary())) {
            diff.contentSummary = true;
        }

        if (item1.getCompareStatus() !== item2.getCompareStatus()) {
            diff.compareStatus = true;
        }

        if (!ObjectHelper.booleanEquals(item1.isRenderable(), item2.isRenderable())) {
            diff.renderable = true;
        }

        return diff;
    }

}
