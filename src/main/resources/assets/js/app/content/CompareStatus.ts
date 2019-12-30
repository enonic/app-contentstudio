import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ContentSummaryAndCompareStatus} from './ContentSummaryAndCompareStatus';

export enum CompareStatus {
    NEW,
    NEW_TARGET,
    NEWER,
    OLDER,
    PENDING_DELETE,
    PENDING_DELETE_TARGET,
    EQUAL,
    MOVED,
    CONFLICT_PATH_EXISTS,
    CONFLICT_VERSION_BRANCH_DIVERGS,
    UNKNOWN
}

export class CompareStatusFormatter {

    public static formatStatusTextFromContent(content: ContentSummaryAndCompareStatus): string {
        if (content) {
            return CompareStatusFormatter.formatStatus(content.getCompareStatus(), content.getContentSummary());
        }

        return '';
    }

    public static formatStatusClassFromContent(content: ContentSummaryAndCompareStatus): string {
        if (content) {
            return CompareStatusFormatter.formatStatus(content.getCompareStatus(), content.getContentSummary(), true);
        }

        return '';
    }

    public static formatStatus(compareStatus: CompareStatus, content?: ContentSummary, isClassName: boolean = false): string {

        let status;

        switch (compareStatus) {
        case CompareStatus.NEW:
            if (content && !content.getPublishFirstTime()) {
                status = isClassName ? 'New' : i18n('status.new');
            } else {
                status = isClassName ? 'Offline' : i18n('status.offline');
            }
            break;
        case CompareStatus.NEWER:
            status = isClassName ? 'Modified' : i18n('status.modified');
            break;
        case CompareStatus.OLDER:
            status = isClassName ? 'Out-of-date' : i18n('status.outofdate');
            break;
        case CompareStatus.PENDING_DELETE:
            status = isClassName ? 'Deleted' : i18n('status.deleted');
            break;
        case CompareStatus.EQUAL:
            status = isClassName ? 'Online' : i18n('status.online');
            break;
        case CompareStatus.MOVED:
            status = isClassName ? 'Moved' : i18n('status.moved');
            break;
        case CompareStatus.PENDING_DELETE_TARGET:
            status = isClassName ? 'Deleted in prod' : i18n('status.deletedinprod');
            break;
        case CompareStatus.NEW_TARGET:
            status = isClassName ? 'New in prod' : i18n('status.newinprod');
            break;
        case CompareStatus.CONFLICT_PATH_EXISTS:
            status = isClassName ? 'Conflict' : i18n('status.conflict');
            break;
        default:
            status = isClassName ? 'Unknown' : i18n('status.unknown');
        }

        if (!!CompareStatus[status]) {
            return isClassName ? 'Unknown' : i18n('status.unknown');
        }

        return status;
    }
}

export class CompareStatusChecker {

    public static isPendingDelete(compareStatus: CompareStatus): boolean {
        return compareStatus === CompareStatus.PENDING_DELETE;
    }

    public static isPublished(compareStatus: CompareStatus): boolean {
        return compareStatus !== CompareStatus.NEW && compareStatus !== CompareStatus.UNKNOWN;
    }

    public static isOnline(compareStatus: CompareStatus): boolean {
        return compareStatus === CompareStatus.EQUAL;
    }

    public static isNew(compareStatus: CompareStatus): boolean {
        return compareStatus === CompareStatus.NEW;
    }
}
