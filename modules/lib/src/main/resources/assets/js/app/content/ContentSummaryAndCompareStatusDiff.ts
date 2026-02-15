import {type Diff} from '../Diff';
import {type ContentSummaryDiff} from './ContentSummaryDiff';

export interface ContentSummaryAndCompareStatusDiff extends Diff {
    uploadItem?: boolean;
    contentSummary?: ContentSummaryDiff;
    compareStatus?: boolean;
    renderable?: boolean;
}
