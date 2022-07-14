import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {CreateParams, VersionHistoryItem} from './VersionHistoryItem';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';

export class ContentVersionsConverter {

    private readonly content: ContentSummaryAndCompareStatus;

    private readonly contentVersions: ContentVersion[];

    private readonly activeVersionId: string;

    private lastDate: string;

    constructor(builder: Builder) {
        this.content = builder.content;
        this.contentVersions = builder.contentVersions;
        this.activeVersionId = builder.activeVersionId;
    }

    toVersionHistoryItems(): VersionHistoryItem[] {
        this.sortByDate();
        return this.convert();
    }

    private sortByDate(): void {
        this.contentVersions.sort((v1: ContentVersion, v2: ContentVersion) => {
            return Number(v2.getDisplayDate()) - Number(v1.getDisplayDate());
        })
    }

    private convert(): VersionHistoryItem[] {
        return this.contentVersions.map((version: ContentVersion, index: number) => this.versionToHistoryItem(version, index));
    }

    private versionToHistoryItem(version: ContentVersion, index: number): VersionHistoryItem {
        if (version.hasPublishInfo()) {
            return this.createHistoryItemFromPublishInfo(version, index);
        }

        return this.createHistoryItemFromVersion(version, index);
    }

    private createHistoryItemFromPublishInfo(version: ContentVersion, index: number): VersionHistoryItem {
        const publishInfo: ContentVersionPublishInfo = version.getPublishInfo();
        const publishDateAsString: string = DateHelper.formatDate(version.getDisplayDate());
        const item: VersionHistoryItem = VersionHistoryItem.fromPublishInfo(publishInfo)
            .setSkipDate(publishDateAsString === this.lastDate)
            .setRepublished(this.isRepublished(this.contentVersions, version, index))

        this.lastDate = publishDateAsString;

        return item;
    }

    private isRepublished(contentVersions: ContentVersion[], version: ContentVersion, index: number): boolean {
        if (!version.isPublished()) {
            return false;
        }

        const publishedFrom: string = DateHelper.formatDateTime(version.getPublishInfo().getPublishedFrom());

        return contentVersions.some((v: ContentVersion, i: number) => {
            if (i <= index || !v.isPublished()) {
                return false;
            }

            const vPublishedFrom: string = DateHelper.formatDateTime(v.getPublishInfo().getPublishedFrom());
            return publishedFrom === vPublishedFrom;
        });
    }

    private createHistoryItemFromVersion(version: ContentVersion, index: number): VersionHistoryItem {
        const timestampAsString: string = this.getVersionTimestampAsString(version, index);
        const item: VersionHistoryItem = VersionHistoryItem.fromContentVersion(version, this.createHistoryItemsParams(version, index))
            .setSkipDate(timestampAsString === this.lastDate)
            .setActiveVersionId(this.activeVersionId)

        this.lastDate = timestampAsString;

        return item;
    }

    private getVersionTimestampAsString(version: ContentVersion, index: number): string {
        const isFirstVersion: boolean = index === this.getLastItemIndex();
        const timestamp: Date = isFirstVersion ? this.content.getContentSummary().getCreatedTime() : version.getTimestamp();
        return DateHelper.formatDate(timestamp);
    }

    private getLastItemIndex(): number {
        return this.contentVersions.length - 1;
    }

    private createHistoryItemsParams(version: ContentVersion, index: number): CreateParams {
        const isFirstVersion: boolean = index === this.getLastItemIndex();
        const timestamp: Date = isFirstVersion ? this.content.getContentSummary().getCreatedTime() : version.getTimestamp();

        const isSortOrPermissionsChange: boolean = !isFirstVersion &&
            !ContentVersion.equalDates(version.getTimestamp(), version.getModified(), 200);
        const isPermissionChange: boolean = isSortOrPermissionsChange &&
                                            version.getChildOrder()?.equals(this.contentVersions[index + 1]?.getChildOrder());
        const isSort: boolean = isSortOrPermissionsChange && !isPermissionChange;

        const createParams: CreateParams = {
            createdDate: isFirstVersion ? timestamp : null,
            isSort: isSort,
            isPermissionChange: isPermissionChange
        };

        return createParams
    }

    static create(): Builder {
        return new Builder();
    }
}

export class Builder {

    content: ContentSummaryAndCompareStatus;

    contentVersions: ContentVersion[];

    activeVersionId: string;

    setContent(value: ContentSummaryAndCompareStatus): Builder {
        this.content = value;
        return this;
    }

    setContentVersions(value: ContentVersion[]): Builder {
        this.contentVersions = value;
        return this;
    }

    setActiveVersionId(value: string): Builder {
        this.activeVersionId = value;
        return this;
    }

    build(): ContentVersionsConverter {
        return new ContentVersionsConverter(this);
    }
}
