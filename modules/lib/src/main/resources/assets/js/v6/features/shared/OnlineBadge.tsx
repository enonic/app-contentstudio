import {cn} from '@enonic/ui';
import {CompareStatus} from '../../../app/content/CompareStatus';
import {WorkflowStateStatus} from '../../../app/wizard/WorkflowStateManager';
import {useI18n} from '../hooks/useI18n';

type Props = {
    status: CompareStatus;
    wasPublished?: boolean;
    workflowStatus?: WorkflowStateStatus;
    className?: string;
}

// TODO: Enonic UI - Replace with StatusBadge
// StatusBadge → DiffStatusBadge, OnlineBadge → StatusBadge
// MainStatus: Offline, Online, Scheduled и Expired
// DiffStatus: <MainStatus> | <DiffStatus> (moved, modified, archived, etc.)
// Publish status can be taken from PublishStatus

const ONLINE_BADGE_NAME = 'OnlineBadge';

export const OnlineBadge = ({status, className}: Props) => {
    const isOnline = status !== CompareStatus.NEW && status !== CompareStatus.UNKNOWN;
    const onlineLabel = useI18n('status.online');
    const offlineLabel = useI18n('status.offline');

    return (
        <span data-component={ONLINE_BADGE_NAME} className={cn('text-sm overflow-hidden text-nowrap truncate', isOnline ? 'text-success' : 'text-error', className)}>
            {isOnline ? onlineLabel : offlineLabel}
        </span>
    );
};

OnlineBadge.displayName = ONLINE_BADGE_NAME;
