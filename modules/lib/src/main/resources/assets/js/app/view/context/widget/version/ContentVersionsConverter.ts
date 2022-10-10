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

    private readonly filteredVersions: ContentVersion[];

    private lastDate: string;

    constructor(builder: Builder) {
        this.content = builder.content;
        this.allContentVersions = builder.contentVersions;
        this.allContentVersions.get().sort(this.sortByDate);
        this.filteredVersions = this.filterSameVersions();
    }

    private sortByDate(v1: ContentVersion, v2: ContentVersion): number {
        return Number(v2.getDisplayDate()) - Number(v1.getDisplayDate());
    }

    toVersionHistoryItems(): VersionHistoryItem[] {
        const result: VersionHistoryItem[] = [];

        this.filteredVersions.forEach((version: ContentVersion, index: number) => {
            const item: VersionHistoryItem = this.versionToHistoryItem(version, index);
            result.push(item);

            if (this.isSameVersionForDraftAndMaster(version)) {
                result.push(this.createHistoryItemFromVersion(version));
            }
        });

        return result;
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

        return this.getPreviousVersion(publishedVersion)?.hasPublishInfo() || publishedVersion.getTimestamp().getTime() -
               publishedVersion.getModified().getTime() < ContentVersionsConverter.FILTER_STEP_MS;
    }

    private versionToHistoryItem(version: ContentVersion, index: number): VersionHistoryItem {
        if (version.hasPublishInfo()) {
            return this.createHistoryItemFromPublishInfo(version, index);
        }

        return this.createHistoryItemFromVersion(version);
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

        return this.filteredVersions.some((v: ContentVersion, i: number) => {
            if (i <= index || !v.isPublished()) {
                return false;
            }

            const vPublishedFrom: string = DateHelper.formatDateTime(v.getPublishInfo().getPublishedFrom());
            return publishedFrom === vPublishedFrom;
        });
    }

    private createHistoryItemFromVersion(version: ContentVersion): VersionHistoryItem {
        const timestampAsString: string = this.getVersionTimestampAsString(version);

        const item: VersionHistoryItem = VersionHistoryItem
            .fromContentVersion(version, this.createHistoryItemsParams(version))
            .setSkipDate(timestampAsString === this.lastDate)
            .setContentId(this.content.getContentId())
            .build();

        this.lastDate = timestampAsString;

        return item;
    }

    private getVersionTimestampAsString(version: ContentVersion): string {
        const isFirstVersion: boolean = version === this.getFirstVersion();
        const timestamp: Date = isFirstVersion ? this.content.getContentSummary().getCreatedTime() : version.getTimestamp();
        return DateHelper.formatDate(timestamp);
    }

    private getFirstVersion(): ContentVersion {
        return this.filteredVersions.slice().pop();
    }

    private createHistoryItemsParams(version: ContentVersion): CreateParams {
        const isFirstVersion: boolean = version === this.getFirstVersion();
        const timestamp: Date = isFirstVersion ? this.content.getContentSummary().getCreatedTime() : version.getTimestamp();
        const previousVersion: ContentVersion = this.getPreviousVersion(version);

        const isNonDataChange: boolean = !isFirstVersion &&
                                         !ContentVersion.equalDates(version.getTimestamp(), version.getModified(), 200);
        const isMove: boolean = !ObjectHelper.stringEquals(version.getPath(), previousVersion?.getPath()) &&
                                (isNonDataChange || previousVersion?.hasPublishInfo());
        const isSort: boolean = !ObjectHelper.equals(version.getChildOrder(), previousVersion?.getChildOrder());
        const isPermissionsChange: boolean = isNonDataChange && this.isPermissionChange(version, previousVersion);

        const createParams: CreateParams = {
            createdDate: isFirstVersion ? timestamp : null,
            isSort: isSort,
            isMove: isMove,
            isPermissionsChange: isPermissionsChange
        };

        return createParams;
    }

    private getPreviousVersion(version: ContentVersion): ContentVersion {
        let previousVersion: ContentVersion = null;

        this.filteredVersions.some((v: ContentVersion, index: number) => {
            if (version === v) {
                previousVersion = this.filteredVersions[index + 1];
                return true;
            }

            return false;
        });

        return previousVersion;
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
