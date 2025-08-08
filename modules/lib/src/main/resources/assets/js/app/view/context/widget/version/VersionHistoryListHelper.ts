import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ContentPath} from '../../../../content/ContentPath';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';
import {VersionItemStatus} from './VersionHistoryItem';

export class VersionHistoryListHelper {

    public static FILTER_STEP_MS: number = 500;

    public static filterSameVersions(versions: ContentVersion[]): ContentVersion[] {
        const filteredVersions: ContentVersion[] = [];
        let previousVersion: ContentVersion = null;

        versions.forEach((version: ContentVersion) => {
            if (!previousVersion || !!version.getPublishInfo() || this.isSeparateVersion(version, previousVersion)) {
                previousVersion = version;
                filteredVersions.push(version);
            }
        });

        return filteredVersions;
    }

    private static isSeparateVersion(v1: ContentVersion, v2: ContentVersion): boolean {
        return Math.abs(v1.getTimestamp().getTime() - v2.getTimestamp().getTime()) > VersionHistoryListHelper.FILTER_STEP_MS;
    }

    public static getPublishVersionItemStatus(version: ContentVersion): VersionItemStatus {
        if (version.isPermissionsChanged()) {
            return VersionItemStatus.PERMISSIONS;
        }

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

    public static getRegularVersionItemStatus(version: ContentVersion, previousVersion?: ContentVersion): VersionItemStatus {
        if (!previousVersion) {
            return VersionItemStatus.CREATED;
        }

        const isSort: boolean = !ObjectHelper.equals(version.getChildOrder(), previousVersion.getChildOrder());

        if (isSort) {
            return VersionItemStatus.SORTED;
        }

        const isNonDataChange: boolean = !ContentVersion.equalDates(version.getTimestamp(), version.getModified(), 200);

        if ((isNonDataChange || previousVersion.hasPublishInfo()) && VersionHistoryListHelper.isPathChanged(version, previousVersion)) {
            return VersionHistoryListHelper.getMoveOrRenameStatus(version, previousVersion);
        }

        if (version.isPermissionsChanged()) {
            return VersionItemStatus.PERMISSIONS;
        }

        if (version.isInReadyState()) {
            return VersionItemStatus.MARKED_AS_READY;
        }

        return VersionItemStatus.EDITED;
    }

    private static isPathChanged(version: ContentVersion, previousVersion: ContentVersion): boolean {
        if (!previousVersion) {
            return false;
        }

        return !ObjectHelper.stringEquals(version.getPath(), previousVersion.getPath());
    }

    // private static isPermissionChange(version: ContentVersion, previousVersion: ContentVersion): boolean {
    //     if (!previousVersion) {
    //         return false;
    //     }
    //
    //     return previousVersion.isInheritPermissions() !== version.isInheritPermissions() ||
    //            !previousVersion.getPermissions().equals(version.getPermissions());
    // }

    private static getMoveOrRenameStatus(version: ContentVersion, previousVersion: ContentVersion): VersionItemStatus {
        const path: ContentPath = ContentPath.create().fromString(version.getPath()).build();
        const previousPath: ContentPath = ContentPath.create().fromString(previousVersion.getPath()).build();

        if (path.getParentPath()?.equals(previousPath.getParentPath())) {
            return VersionItemStatus.RENAMED;
        }

        return VersionItemStatus.MOVED;
    }
}
