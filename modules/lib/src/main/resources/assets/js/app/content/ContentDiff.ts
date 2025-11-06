import {ContentSummaryDiff} from './ContentSummaryDiff';

export interface ContentDiff extends ContentSummaryDiff {
    data?: boolean;
    mixins?: boolean;
    pageObj?: boolean;
    permissions?: boolean;
    attachments?: boolean;
}
