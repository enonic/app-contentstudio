import {i18n} from 'lib-admin-ui/util/Messages';

export enum CompareStatus {
    NEW = 'new',
    NEWER = 'modified',
    OLDER = 'out-of-date',
    EQUAL = 'online',
    MOVED = 'moved',
    UNKNOWN = 'unknown'
}

export class CompareStatusFormatter {
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
}
