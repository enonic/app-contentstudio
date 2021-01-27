import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentSummaryAndCompareStatus} from './ContentSummaryAndCompareStatus';

export enum CompareStatus {
    NEW,
    NEWER,
    OLDER,
    PENDING_DELETE,
    EQUAL,
    MOVED,
    UNKNOWN
}

export class CompareStatusFormatter {

    public static formatStatusClass(compareStatus: CompareStatus): string {

        switch (compareStatus) {
        case CompareStatus.NEW:
            return 'new';
            break;
        case CompareStatus.NEWER:
            return 'modified';
            break;
        case CompareStatus.PENDING_DELETE:
            return 'deleted';
            break;
        case CompareStatus.EQUAL:
            return 'online';
            break;
        case CompareStatus.MOVED:
            return 'moved';
            break;
        default:
            return 'unknown';
        }
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
            status = i18n('status.published');
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

    public static isModified(compareStatus: CompareStatus): boolean {
        return compareStatus === CompareStatus.NEWER;
    }
}
