import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export enum PublishStatus {
    ONLINE = 'online', PENDING = 'pending', EXPIRED = 'expired', OFFLINE = 'offline'
}

export class PublishStatusFormatter {
    public static formatStatusText(publishStatus: PublishStatus): string {

        switch (publishStatus) {
        case PublishStatus.ONLINE:
            return i18n('status.published');
            break;
        case PublishStatus.PENDING:
            return i18n('status.scheduled');
            break;
        case PublishStatus.EXPIRED:
            return i18n('status.expired');
            break;
        case PublishStatus.OFFLINE:
            return i18n('status.offline');
            break;
        default:
            return i18n('status.unknown');
        }
    }
}

export class PublishStatusChecker {

    public static isOnline(publishStatus: PublishStatus): boolean {
        return publishStatus === PublishStatus.ONLINE;
    }

    public static isScheduled(publishStatus: PublishStatus): boolean {
        return publishStatus === PublishStatus.PENDING;
    }

    public static isExpired(publishStatus: PublishStatus): boolean {
        return publishStatus === PublishStatus.EXPIRED;
    }

    static isOffline(status: PublishStatus): boolean {
        return status === PublishStatus.OFFLINE;
    }
}
