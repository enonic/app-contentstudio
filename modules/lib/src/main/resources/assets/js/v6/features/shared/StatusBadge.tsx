import {cn} from '@enonic/ui';
import {CompareStatus} from '../../../app/content/CompareStatus';
import {WorkflowStateStatus} from '../../../app/wizard/WorkflowStateManager';
import {useI18n} from '../hooks/useI18n';
import {StatusIcon} from './icons/StatusIcon';

type Props = {
    status: CompareStatus;
    wasPublished?: boolean;
    workflowStatus?: WorkflowStateStatus;
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

function buildWorkflowStatusKeys(workflowStatus: WorkflowStateStatus): string {
    switch (workflowStatus) {
        case WorkflowStateStatus.READY:
            return 'field.workflow.status.ready';
        case WorkflowStateStatus.IN_PROGRESS:
            return 'field.workflow.status.inProgress';
        case WorkflowStateStatus.INVALID:
            return 'field.workflow.status.invalid';
        default:
            return 'status.unknown';
    }
}

const STATUS_BADGE_NAME = 'StatusBadge';

export const StatusBadge = ({status, workflowStatus, wasPublished, className}: Props) => {
    const isOnline = status !== CompareStatus.NEW && status !== CompareStatus.UNKNOWN;
    const onlineLabel = useI18n('status.online');

    const isMoved = status === CompareStatus.MOVED;
    const modifiedLabel = useI18n('status.modified');
    const statusLabel = useI18n(buildStatusKeys(status, wasPublished));
    const statusLabels = isMoved ? `${modifiedLabel}, ${statusLabel}` : statusLabel;
    const workflowStatusLabel = useI18n(buildWorkflowStatusKeys(workflowStatus));

    return (
        <span data-component={STATUS_BADGE_NAME} className={cn('flex items-center gap-x-2 text-sm overflow-hidden', className)}>
            {isOnline && <span className="text-success capitalize border-r-1 border-bdr-subtle pr-2">{onlineLabel}</span>}
            <span className='text-subtle italic capitalize'>{statusLabels}</span>
            {workflowStatus && <span className="inline-flex items-center gap-x-1 overflow-hidden border-l-1 border-bdr-subtle pl-2 text-nowrap">
                <StatusIcon status={workflowStatus} aria-label={workflowStatusLabel} className="shrink-0" />
                <span className="text-nowrap truncate">{workflowStatusLabel}</span>
            </span>}
        </span>
    );
};

StatusBadge.displayName = STATUS_BADGE_NAME;
