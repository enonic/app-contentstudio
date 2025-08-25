import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersionsConverter} from './ContentVersionsConverter';
import {VersionHistoryItem} from './VersionHistoryItem';

export class NonBatchedContentVersionsConverter extends ContentVersionsConverter {

    constructor(content: ContentSummaryAndCompareStatus) {
        super(content);
    }

    public convert(versions: ContentVersion[]): VersionHistoryItem[] {
        this.allVersions = versions.slice();
        this.lastDate = null;
        return this.makeVersionHistoryItems(this.allVersions, false);
    }
}
