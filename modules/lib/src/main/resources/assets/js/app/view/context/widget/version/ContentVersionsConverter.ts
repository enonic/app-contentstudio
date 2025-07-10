import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {ContentPath} from '../../../../content/ContentPath';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';
import {VersionHistoryItem, VersionHistoryItemBuilder, VersionItemStatus} from './VersionHistoryItem';

export class ContentVersionsConverter {

    private static FILTER_STEP_MS: number = 500;

    private readonly content: ContentSummaryAndCompareStatus;

    private readonly allContentVersions: ContentVersion[];

    private readonly filteredVersions: ContentVersion[];

    private lastDate: string;

    constructor(builder: Builder) {
        this.content = builder.content;
        this.allContentVersions = builder.contentVersions;
        this.allContentVersions.sort(this.sortByDate);
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

        this.allContentVersions.forEach((version: ContentVersion) => {
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
        const publishInfo: ContentVersionPublishInfo = publishedVersion.getPublishInfo();

        if (publishInfo?.isPublished() || publishInfo?.isScheduled()) {
            return this.getPreviousVersion(publishedVersion)?.hasPublishInfo() || publishedVersion.getTimestamp().getTime() -
                   publishedVersion.getModified().getTime() < ContentVersionsConverter.FILTER_STEP_MS;
        }

        return false;
    }

    private versionToHistoryItem(version: ContentVersion, index: number): VersionHistoryItem {
        if (version.hasPublishInfo()) {
            return this.createHistoryItemFromPublishInfo(version, index);
        }

        return this.createHistoryItemFromVersion(version);
    }

    private createHistoryItemFromPublishInfo(version: ContentVersion, index: number): VersionHistoryItem {
        const publishDateAsString: string = DateHelper.formatDate(version.getDisplayDate());
        const publishInfo: ContentVersionPublishInfo = version.getPublishInfo();
        const status: VersionItemStatus = this.getPublishVersionItemStatus(version);

        const builder: VersionHistoryItemBuilder = new VersionHistoryItemBuilder()
            .setStatus(status)
            .setVersion(version)
            .setDateTime(publishInfo.getTimestamp())
            .setUser(publishInfo.getPublisherDisplayName() || publishInfo.getPublisher())
            .setSkipDate(publishDateAsString === this.lastDate)
            .setRepublished(this.isRepublished(version, index))
            .setMessage(publishInfo.getMessage())
            .setContentId(this.content.getContentId());

        if (publishInfo.isPublished()) {
            builder.setActiveTo(publishInfo.getPublishedTo());

            if (!publishInfo.isScheduled()) {
                builder.setActiveFrom(publishInfo.getPublishedFrom());
            }
        }

        this.lastDate = publishDateAsString;

        return builder.build();
    }

    private getPublishVersionItemStatus(version: ContentVersion): VersionItemStatus {
        const publishInfo: ContentVersionPublishInfo = version.getPublishInfo();

        if (publishInfo.isPublished()) {
            if (publishInfo.isScheduled()) {
                return VersionItemStatus.SCHEDULED;
            } else {
                return VersionItemStatus.PUBLISHED;
            }
        } else if (publishInfo.isUnpublished()) {
            return VersionItemStatus.UNPUBLISHED;
        } else if (publishInfo.isArchived()) {
            return VersionItemStatus.ARCHIVED;
        } else if (publishInfo.isRestored()) {
            return VersionItemStatus.RESTORED;
        }

        return VersionItemStatus.EDITED;
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
        const isFirstVersion: boolean = version === this.getFirstVersion();
        const timestamp: Date = isFirstVersion ? this.content.getContentSummary().getCreatedTime() : version.getTimestamp();
        const status: VersionItemStatus = this.getRegularVersionItemStatus(version);

        const item: VersionHistoryItem = new VersionHistoryItemBuilder()
            .setStatus(status)
            .setDateTime(timestamp)
            .setVersion(version)
            .setUser(version.getModifierDisplayName() || version.getModifier())
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

    private getRegularVersionItemStatus(version: ContentVersion): VersionItemStatus {
        const isFirstVersion: boolean = version === this.getFirstVersion();

        if (isFirstVersion) {
            return VersionItemStatus.CREATED;
        }

        const previousVersion: ContentVersion = this.getPreviousVersion(version);
        const isSort: boolean = !ObjectHelper.equals(version.getChildOrder(), previousVersion?.getChildOrder());

        if (isSort) {
            return VersionItemStatus.SORTED;
        }

        const isNonDataChange: boolean = !isFirstVersion &&
                                         !ContentVersion.equalDates(version.getTimestamp(), version.getModified(), 200);

        if ((isNonDataChange || previousVersion?.hasPublishInfo()) && this.isPathChanged(version, previousVersion)) {
            return this.getMoveOrRenameStatus(version, previousVersion);
        }

        const isPermissionsChange: boolean = isNonDataChange && this.isPermissionChange(version, previousVersion);

        if (isPermissionsChange) {
            return VersionItemStatus.PERMISSIONS;
        }

        if (version.isInReadyState()) {
            return VersionItemStatus.MARKED_AS_READY;
        }

        return VersionItemStatus.EDITED;
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

    private isPathChanged(version: ContentVersion, previousVersion: ContentVersion): boolean {
        if (!previousVersion) {
            return false;
        }

        return !ObjectHelper.stringEquals(version.getPath(), previousVersion.getPath());
    }

    private getMoveOrRenameStatus(version: ContentVersion, previousVersion: ContentVersion): VersionItemStatus {
        const path: ContentPath = ContentPath.create().fromString(version.getPath()).build();
        const previousPath: ContentPath = ContentPath.create().fromString(previousVersion.getPath()).build();

        if (path.getParentPath()?.equals(previousPath.getParentPath())) {
            return VersionItemStatus.RENAMED;
        }

        return VersionItemStatus.MOVED;
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

    contentVersions: ContentVersion[];

    setContent(value: ContentSummaryAndCompareStatus): Builder {
        this.content = value;
        return this;
    }

    setContentVersions(value: ContentVersion[]): Builder {
        this.contentVersions = value;
        return this;
    }

    build(): ContentVersionsConverter {
        return new ContentVersionsConverter(this);
    }
}
