import {type ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {type ContentVersion} from '../../../../ContentVersion';
import {ContentVersionsConverter} from './ContentVersionsConverter';
import {type VersionHistoryItem} from './VersionHistoryItem';

export class NonBatchedContentVersionsConverter extends ContentVersionsConverter {

    constructor(content: ContentSummaryAndCompareStatus, creatorDisplayName: string) {
        super(content, creatorDisplayName);
    }

    public convert(versions: ContentVersion[]): VersionHistoryItem[] {
        this.allVersions = versions.slice();
        this.lastDate = null;
        return this.makeVersionHistoryItems(this.allVersions, false);
    }
}
