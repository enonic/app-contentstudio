import {cn} from '@enonic/ui';
import {CompareStatus, CompareStatusChecker, CompareStatusFormatter} from '../../../app/content/CompareStatus';
import {useI18n} from '../hooks/useI18n';
import {i18n} from '.xp/dev/lib-admin-ui/util/Messages';

type Props = {
    status: CompareStatus;
    wasPublished?: boolean;
    className?: string;
}

function buildStatusKeys(status: CompareStatus, wasPublished: boolean): string {
    switch (status) {
        case CompareStatus.NEW:
            return wasPublished ? 'status.unpublished' : 'status.new';
        case CompareStatus.NEWER:
            return 'status.modified';
        case CompareStatus.OLDER:
            return 'status.outofdate';
        case CompareStatus.EQUAL:
            return 'status.published';
        case CompareStatus.MOVED:
            return 'status.moved';
        case CompareStatus.ARCHIVED:
            return 'status.archived';
        default:
            return 'status.unknown';
    }
}

export const StatusBadge = ({status, wasPublished, className}: Props) => {
    const isOnline = status !== CompareStatus.NEW && status !== CompareStatus.UNKNOWN;
    const onlineLabel = useI18n('status.online');

    const isMoved = status === CompareStatus.MOVED;
    const modifiedLabel = useI18n('status.modified');
    const statusLabel = useI18n(buildStatusKeys(status, wasPublished));
    const statusLabels = isMoved ? `${modifiedLabel}, ${statusLabel}` : statusLabel;

    return (
        <span className={cn('flex items-center gap-x-2 text-sm capitalize', className)}>
            {isOnline && <span className="text-success border-r-1 border-bdr-subtle pr-2">{onlineLabel}</span>}
            <span className='text-subtle italic'>{statusLabels}</span>
        </span>
    );
};
