import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {ContentVersion, ContentVersionBuilder} from '../../../../ContentVersion';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {CreateParams, VersionHistoryItem} from './VersionHistoryItem';
import {ContentVersions} from '../../../../ContentVersions';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class ContentVersionsConverter {

    private static FILTER_STEP_MS: number = 500;

    private readonly content: ContentSummaryAndCompareStatus;

    private readonly allContentVersions: ContentVersions;

    private lastDate: string;

    constructor(builder: Builder) {
        this.content = builder.content;
        this.allContentVersions = builder.contentVersions;
    }

    toVersionHistoryItems(): VersionHistoryItem[] {
        this.sortByDate();
        return this.convert();
    }

    private sortByDate(): void {
        this.allContentVersions.get().sort((v1: ContentVersion, v2: ContentVersion) => {
            return Number(v2.getDisplayDate()) - Number(v1.getDisplayDate());
        });
    }

    private convert(): VersionHistoryItem[] {
        const resultingVersions: ContentVersion[] = [];
        const filteredVersions: ContentVersion[] = this.filterSameVersions();

        filteredVersions.forEach((filteredVersion: ContentVersion) => {
            resultingVersions.push(filteredVersion);

            if (this.isSameVersionForDraftAndMaster(filteredVersion)) {
                resultingVersions.push(this.cloneVersionNoPublishInfo(filteredVersion));
            }

        });

        return resultingVersions.map((version: ContentVersion, index: number) => {
            return this.versionToHistoryItem(version, index);
        });
    }

    private filterSameVersions(): ContentVersion[] {
        const filteredVersions: ContentVersion[] = [];
        let previousVersion: ContentVersion = null;

        this.allContentVersions.get().forEach((version: ContentVersion) => {
            if (!previousVersion || !!version.getPublishInfo() || this.isSeparateVersion(version, previousVersion)) {
                previousVersion = version;
                filteredVersions.push(version);
            }
        });

        return filteredVersions;
    }

    private isSeparateVersion(v1: ContentVersion, v2: ContentVersion): boolean {
        return Math.abs(v1.getTimestamp().getTime() - v2.getTimestamp().getTime()) > ContentVersionsConverter.FILTER_STEP_MS;
    }

    private isSameVersionForDraftAndMaster(publishedVersion: ContentVersion): boolean {
        if (!publishedVersion.getPublishInfo()) {
            return false;
        }

        return publishedVersion.getTimestamp().getTime() - publishedVersion.getModified().getTime() <
               ContentVersionsConverter.FILTER_STEP_MS;
    }

    private cloneVersionNoPublishInfo(publishedVersion: ContentVersion): ContentVersion {
        const builder: ContentVersionBuilder = publishedVersion.newBuilder();
        builder.publishInfo = null;
        return builder.build();
    }

    private versionToHistoryItem(version: ContentVersion, index: number): VersionHistoryItem {
        if (version.hasPublishInfo()) {
            return this.createHistoryItemFromPublishInfo(version, index);
        }

        return this.createHistoryItemFromVersion(version, index);
    }

    private createHistoryItemFromPublishInfo(version: ContentVersion, index: number): VersionHistoryItem {
        const publishDateAsString: string = DateHelper.formatDate(version.getDisplayDate());

        const item: VersionHistoryItem = VersionHistoryItem
            .fromPublishInfo(version)
            .setSkipDate(publishDateAsString === this.lastDate)
            .setRepublished(this.isRepublished(version, index))
            .setContentId(this.content.getContentId())
            .build();

        this.lastDate = publishDateAsString;

        return item;
    }

    private isRepublished(version: ContentVersion, index: number): boolean {
        if (!version.isPublished()) {
            return false;
        }

        const publishedFrom: string = DateHelper.formatDateTime(version.getPublishInfo().getPublishedFrom());

        return this.allContentVersions.get().some((v: ContentVersion, i: number) => {
            if (i <= index || !v.isPublished()) {
                return false;
            }

            const vPublishedFrom: string = DateHelper.formatDateTime(v.getPublishInfo().getPublishedFrom());
            return publishedFrom === vPublishedFrom;
        });
    }

    private createHistoryItemFromVersion(version: ContentVersion, index: number): VersionHistoryItem {
        const timestampAsString: string = this.getVersionTimestampAsString(version, index);

        const item: VersionHistoryItem = VersionHistoryItem
            .fromContentVersion(version, this.createHistoryItemsParams(version, index))
            .setSkipDate(timestampAsString === this.lastDate)
            .setContentId(this.content.getContentId())
            .build();

        this.lastDate = timestampAsString;

        return item;
    }

    private getVersionTimestampAsString(version: ContentVersion, index: number): string {
        const isFirstVersion: boolean = index === this.getLastItemIndex();
        const timestamp: Date = isFirstVersion ? this.content.getContentSummary().getCreatedTime() : version.getTimestamp();
        return DateHelper.formatDate(timestamp);
    }

    private getLastItemIndex(): number {
        return this.allContentVersions.get().length - 1;
    }

    private createHistoryItemsParams(version: ContentVersion, index: number): CreateParams {
        const isFirstVersion: boolean = index === this.getLastItemIndex();
        const timestamp: Date = isFirstVersion ? this.content.getContentSummary().getCreatedTime() : version.getTimestamp();
        const previousVersion: ContentVersion = this.allContentVersions.get()[index + 1];

        const isMove: boolean = !ObjectHelper.stringEquals(version.getPath(), previousVersion?.getPath());
        const isSort: boolean = !ObjectHelper.equals(version.getChildOrder(), previousVersion?.getChildOrder());
        const isPermissionsChange: boolean = this.isPermissionChange(version, previousVersion);

        const createParams: CreateParams = {
            createdDate: isFirstVersion ? timestamp : null,
            isSort: isSort,
            isMove: isMove,
            isPermissionsChange: isPermissionsChange
        };

        return createParams;
    }

    private isPermissionChange(version: ContentVersion, previousVersion: ContentVersion): boolean {
        if (!previousVersion) {
            return false;
        }

        return previousVersion.isInheritPermissions() !== version.isInheritPermissions() ||
               !previousVersion.getPermissions().equals(version.getPermissions());
    }

    static create(): Builder {
        return new Builder();
    }
}

export class Builder {

    content: ContentSummaryAndCompareStatus;

    contentVersions: ContentVersions;

    setContent(value: ContentSummaryAndCompareStatus): Builder {
        this.content = value;
        return this;
    }

    setContentVersions(value: ContentVersions): Builder {
        this.contentVersions = value;
        return this;
    }

    build(): ContentVersionsConverter {
        return new ContentVersionsConverter(this);
    }
}
