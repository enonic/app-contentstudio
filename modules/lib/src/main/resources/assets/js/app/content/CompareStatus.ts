import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export enum CompareStatus {
    NEW,
    NEWER,
    OLDER,
    EQUAL,
    MOVED,
    UNKNOWN,
    ARCHIVED
}

export class CompareStatusFormatter {

    public static formatStatusClass(compareStatus: CompareStatus): string {

        switch (compareStatus) {
        case CompareStatus.NEW:
            return 'new';
        case CompareStatus.NEWER:
            return 'modified';
        case CompareStatus.EQUAL:
            return 'online';
        case CompareStatus.MOVED:
            return 'moved';
        case CompareStatus.ARCHIVED:
            return 'archived';
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
        case CompareStatus.EQUAL:
            status = i18n('status.published');
            break;
        case CompareStatus.MOVED:
            status = i18n('status.moved');
            break;
        case CompareStatus.ARCHIVED:
            status = i18n('status.archived');
            break;
        default:
            status = i18n('status.unknown');
        }

        return status;
    }
}

export class CompareStatusChecker {

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

    public static isMoved(compareStatus: CompareStatus): boolean {
        return compareStatus === CompareStatus.MOVED;
    }
}
