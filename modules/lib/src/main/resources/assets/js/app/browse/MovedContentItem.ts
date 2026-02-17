import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {type ContentPath} from '../content/ContentPath';

export class MovedContentItem {

    readonly item: ContentSummaryAndCompareStatus;

    readonly oldPath: ContentPath;

    constructor(item: ContentSummaryAndCompareStatus, oldPath: ContentPath) {
        this.item = item;
        this.oldPath = oldPath;
    }
}
