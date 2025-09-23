import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersionsConverter} from './ContentVersionsConverter';
import {VersionHistoryItem} from './VersionHistoryItem';

export class BatchedContentVersionsConverter extends ContentVersionsConverter {

    constructor(content: ContentSummaryAndCompareStatus, creatorDisplayName: string) {
        super(content, creatorDisplayName);
    }

    public append(versions: ContentVersion[], isMoreVersionsToBeAdded: boolean): VersionHistoryItem[] {
        this.allVersions.push(...versions.slice());
        return this.makeVersionHistoryItems(this.allVersions, isMoreVersionsToBeAdded);
    }

}
