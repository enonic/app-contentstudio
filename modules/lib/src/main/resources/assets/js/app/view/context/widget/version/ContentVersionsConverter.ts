import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {VersionHistoryItem, VersionHistoryItemBuilder, VersionItemStatus} from './VersionHistoryItem';
import {ContentVersions} from '../../../../ContentVersions';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ContentPath} from '../../../../content/ContentPath';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';

export class ContentVersionsConverter {

    private static FILTER_STEP_MS: number = 500;

    private readonly content: ContentSummaryAndCompareStatus;

    private readonly allContentVersions: ContentVersions;

    private readonly filteredVersions: ContentVersion[];

    private lastDate: string;

    private creatorDisplayName: string;

    constructor(builder: Builder) {
        this.content = builder.content;
        this.allContentVersions = builder.contentVersions;
        this.allContentVersions.get().sort(this.sortByDate);
        this.filteredVersions = this.filterSameVersions();
        this.creatorDisplayName = builder.creatorDisplayName;
    }

    private sortByDate(v1: ContentVersion, v2: ContentVersion): number {
        return Number(v2.getDisplayDate()) - Number(v1.getDisplayDate());
    }

    toVersionHistoryItems(): VersionHistoryItem[] {
        const result: VersionHistoryItem[] = [];

        this.filteredVersions.forEach((version: ContentVersion, index: number) => {
            const previousVersion = this.filteredVersions[index + 1];

            if (version.hasPublishInfo()) {
                result.push(this.createHistoryItemFromPublishInfo(version, index));

                if (this.isSameVersionForDraftAndMaster(version, previousVersion)) {
                    result.push(...this.createRegularVersions(version, previousVersion));
                }
            } else {
                result.push(...this.createRegularVersions(version, previousVersion));
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

    private createHistoryItemFromVersion(version: ContentVersion, status: VersionItemStatus, timestamp: Date,
                                         readonly?: boolean): VersionHistoryItem {
        const timestampAsString: string = DateHelper.formatDate(timestamp);

        const item: VersionHistoryItem = new VersionHistoryItemBuilder()
            .setStatus(status)
            .setDateTime(timestamp)
            .setVersion(version)
            .setUser(version.getModifierDisplayName() || version.getModifier())
            .setSkipDate(timestampAsString === this.lastDate)
            .setContentId(this.content.getContentId())
            .setReadonly(!!readonly)
            .build();

        this.lastDate = timestampAsString;

        return item;
    }

    private isCreatedVersion(version: ContentVersion): boolean {
        return version.getTimestamp().getTime() - this.content.getContentSummary().getCreatedTime().getTime() <
               ContentVersionsConverter.FILTER_STEP_MS;
    }

    private createRegularVersions(version: ContentVersion, previousVersion?: ContentVersion): VersionHistoryItem[] {
        if (previousVersion) { // no need to generate additional items
            return [this.createHistoryItemFromVersion(version,
                this.getRegularVersionItemStatus(version, previousVersion), version.getTimestamp())];
        }

        if (this.isCreatedVersion(version)) { // no need to generate additional items
            return [this.createHistoryItemFromVersion(version, VersionItemStatus.CREATED,
                this.content.getContentSummary().getCreatedTime())];
        }

        // last version and it's timestamp is not close to the content creation time -> making a synthetic item for the content creation
        return [this.createHistoryItemFromVersion(version, VersionItemStatus.EDITED, version.getTimestamp()),
            this.makeCreatedVersionHistoryItem(version)];
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

    private getRegularVersionItemStatus(version: ContentVersion, previousVersion?: ContentVersion): VersionItemStatus {
        if (!previousVersion) {
            return VersionItemStatus.CREATED;
        }

        const isSort: boolean = !ObjectHelper.equals(version.getChildOrder(), previousVersion.getChildOrder());

        if (isSort) {
            return VersionItemStatus.SORTED;
        }

        const isNonDataChange: boolean = !ContentVersion.equalDates(version.getTimestamp(), version.getModified(), 200);

        if ((isNonDataChange || previousVersion.hasPublishInfo()) && this.isPathChanged(version, previousVersion)) {
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

    private isPathChanged(version: ContentVersion, previousVersion: ContentVersion): boolean {
        if (!previousVersion) {
            return false;
        }

        return !ObjectHelper.stringEquals(version.getPath(), previousVersion.getPath());
    }

    private getMoveOrRenameStatus(version: ContentVersion, previousVersion: ContentVersion): VersionItemStatus {
        const path = ContentPath.create().fromString(version.getPath()).build();
        const previousPath = ContentPath.create().fromString(previousVersion.getPath()).build();

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

    private isSameVersionForDraftAndMaster(publishedVersion: ContentVersion, previousVersion?: ContentVersion): boolean {
        const publishInfo: ContentVersionPublishInfo = publishedVersion.getPublishInfo();

        if (publishInfo?.isPublished() || publishInfo?.isScheduled()) {
            return previousVersion?.hasPublishInfo() || publishedVersion.getTimestamp().getTime() -
                   publishedVersion.getModified().getTime() < ContentVersionsConverter.FILTER_STEP_MS;
        }

        return false;
    }

    private makeCreatedVersionHistoryItem(version: ContentVersion): VersionHistoryItem {
        const virtualCreatedVersion = version.newBuilder();
        virtualCreatedVersion.id = 'generated-created';
        virtualCreatedVersion.modifier = this.content.getContentSummary().getCreator().toString();
        virtualCreatedVersion.modifierDisplayName = this.creatorDisplayName;

        return this.createHistoryItemFromVersion(virtualCreatedVersion.build(), VersionItemStatus.CREATED,
            this.content.getContentSummary().getCreatedTime(), true);
    }

    static create(): Builder {
        return new Builder();
    }
}

export class Builder {

    content: ContentSummaryAndCompareStatus;

    contentVersions: ContentVersions;

    creatorDisplayName: string;

    setContent(value: ContentSummaryAndCompareStatus): Builder {
        this.content = value;
        return this;
    }

    setContentVersions(value: ContentVersions): Builder {
        this.contentVersions = value;
        return this;
    }

    setCreatorDisplayName(value: string): Builder {
        this.creatorDisplayName = value;
        return this;
    }

    build(): ContentVersionsConverter {
        return new ContentVersionsConverter(this);
    }
}
