import {ContentSummaryAndCompareStatusViewer} from './ContentSummaryAndCompareStatusViewer';
import {ContentSummaryAndCompareStatus} from './ContentSummaryAndCompareStatus';

export class ContentSummaryListViewer
    extends ContentSummaryAndCompareStatusViewer {

    resolveDisplayName(object: ContentSummaryAndCompareStatus): string {
        if (object.hasContentSummary()) {
            return object.getContentSummary().getListTitle();
        }

        return super.resolveDisplayName(object);
    }
}
