import {i18n} from 'lib-admin-ui/util/Messages';
import {CompareStatus} from '../content/CompareStatus';

export enum PublishStatus {
    ONLINE, PENDING, EXPIRED
}

export class PublishStatusFormatter {
    public static formatStatus(publishStatus: PublishStatus): string {

        let status;

        switch (publishStatus) {
        case PublishStatus.ONLINE:
            status = i18n('status.online');
            break;
        case PublishStatus.PENDING:
            status = i18n('status.pending');
            break;
        case PublishStatus.EXPIRED:
            status = i18n('status.expired');
            break;
        default:
            status = i18n('status.unknown');
        }

        if (CompareStatus[status]) {
            return i18n('status.unknown');
        }

        return status;
    }
}
