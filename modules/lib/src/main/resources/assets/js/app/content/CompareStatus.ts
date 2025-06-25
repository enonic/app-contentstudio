import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export enum CompareStatus {
    NEW = 'new',
    NEWER = 'modified',
    OLDER = 'outofdate',
    EQUAL = 'published',
    MOVED = 'moved',
    ARCHIVED = 'archived',
    UNKNOWN = 'unknown',
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
        switch (compareStatus) {
            case CompareStatus.NEW:
                return i18n('status.new');
            case CompareStatus.NEWER:
                return i18n('status.modified');
            case CompareStatus.OLDER:
                return i18n('status.outofdate');
            case CompareStatus.EQUAL:
                return i18n('status.published');
            case CompareStatus.MOVED:
                return i18n('status.moved');
            case CompareStatus.ARCHIVED:
                return i18n('status.archived');
            default:
                return i18n('status.unknown');
        }
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
