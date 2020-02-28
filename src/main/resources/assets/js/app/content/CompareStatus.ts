import {i18n} from 'lib-admin-ui/util/Messages';
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
        if (!content) {
            return '';
        }

        if (content.getCompareStatus() === CompareStatus.NEW) {

            if (content.getContentSummary().getPublishFirstTime()) {
                return i18n('status.offline');
            }

            return i18n('status.new');
        }

        return CompareStatusFormatter.formatStatusText(content.getCompareStatus());
    }

    public static formatStatusClassFromContent(content: ContentSummaryAndCompareStatus): string {
        if (!content) {
            return '';
        }

        if (content.getCompareStatus() === CompareStatus.NEW) {

            if (content.getContentSummary().getPublishFirstTime()) {
                return 'offline';
            }

            return 'new';
        }

        return CompareStatusFormatter.formatStatusClass(content.getCompareStatus());
    }

    public static formatStatusClass(compareStatus: CompareStatus): string {

        let status;

        switch (compareStatus) {
            case CompareStatus.NEW:
                status = 'New';
                break;
            case CompareStatus.NEWER:
                status = 'Modified';
                break;
            case CompareStatus.OLDER:
                status = 'Out-of-date';
                break;
            case CompareStatus.PENDING_DELETE:
                status = 'Deleted';
                break;
            case CompareStatus.EQUAL:
                status = 'Online';
                break;
            case CompareStatus.MOVED:
                status = 'Moved';
                break;
            default:
                status = 'Unknown';
        }

        return status.toLowerCase();
    }

    public static formatStatusText(compareStatus: CompareStatus): string {

        let status;

        switch (compareStatus) {
            case CompareStatus.NEW:
                status = i18n('status.new');
                break;
            case CompareStatus.NEWER:
                status = i18n('status.modified');
                break;
            case CompareStatus.OLDER:
                status = i18n('status.outofdate');
                break;
            case CompareStatus.PENDING_DELETE:
                status = i18n('status.deleted');
                break;
            case CompareStatus.EQUAL:
                status = i18n('status.online');
                break;
            case CompareStatus.MOVED:
                status = i18n('status.moved');
                break;
            default:
                status = i18n('status.unknown');
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
