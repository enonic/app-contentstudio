import {Diff} from '../Diff';
import {ContentSummaryDiff} from './ContentSummaryDiff';

export interface ContentSummaryAndCompareStatusDiff extends Diff {
    uploadItem?: boolean;
    contentSummary?: ContentSummaryDiff;
    compareStatus?: boolean;
    renderable?: boolean;
}
