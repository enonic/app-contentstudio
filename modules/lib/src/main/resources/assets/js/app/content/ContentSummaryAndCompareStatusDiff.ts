import {Diff} from '../Diff';

export interface ContentSummaryAndCompareStatusDiff extends Diff {
    uploadItem?: boolean;
    contentSummary?: boolean;
    compareStatus?: boolean;
    renderable?: boolean;
}
