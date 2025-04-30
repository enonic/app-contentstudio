import {ContentSummaryDiff} from './ContentSummaryDiff';

export interface ContentDiff extends ContentSummaryDiff {
    data?: boolean;
    extraData?: boolean;
    pageObj?: boolean;
    permissions?: boolean;
    attachments?: boolean;
}
