import {type ContentSummaryAndCompareStatus} from './ContentSummaryAndCompareStatus';
import {type ContentSummaryAndCompareStatusDiff} from './ContentSummaryAndCompareStatusDiff';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ContentSummaryHelper} from './ContentSummaryHelper';

export class ContentSummaryAndCompareStatusHelper {

    public static diff(item1: ContentSummaryAndCompareStatus, item2: ContentSummaryAndCompareStatus): ContentSummaryAndCompareStatusDiff {
        const diff: ContentSummaryAndCompareStatusDiff = {};

        if (!ObjectHelper.equals(item1.getUploadItem(), item2.getUploadItem())) {
            diff.uploadItem = true;
        }

        if (ObjectHelper.bothDefined(item1.getContentSummary(), item2.getContentSummary())) {
            diff.contentSummary = ContentSummaryHelper.diff(item1.getContentSummary(), item2.getContentSummary());
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
