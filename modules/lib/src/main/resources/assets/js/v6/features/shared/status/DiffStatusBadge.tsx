import {cn} from '@enonic/ui';
import {CompareStatus} from '../../../../app/content/CompareStatus';
import {PublishStatus} from '../../../../app/publish/PublishStatus';
import {WorkflowStateStatus} from '../../../../app/wizard/WorkflowStateManager';
import {useI18n} from '../../hooks/useI18n';
import {createCompareStatusKey, createPublishStatusKey, createWorkflowStatusKey} from '../../utils/cms/content/status';
import {StatusIcon} from '../icons/StatusIcon';

type Props = {
    publishStatus: PublishStatus;
    compareStatus: CompareStatus;
    workflowStatus?: WorkflowStateStatus;
    wasPublished: boolean;
    className?: string;
}

const DIFF_STATUS_BADGE_NAME = 'DiffStatusBadge';

export const DiffStatusBadge = ({publishStatus, compareStatus, workflowStatus, wasPublished, className}: Props) => {
    const isOnline = publishStatus === PublishStatus.ONLINE;
    const isMoved = compareStatus === CompareStatus.MOVED;
    const hasDiff = compareStatus !== CompareStatus.EQUAL;

    const publishStatusLabel = useI18n(createPublishStatusKey(publishStatus));
    const modifiedLabel = useI18n('status.modified');
    const workflowStatusLabel = useI18n(createWorkflowStatusKey(workflowStatus));
    const compareStatusLabel = useI18n(createCompareStatusKey(compareStatus, wasPublished));
    const compareStatusLabels = isMoved ? `${modifiedLabel}, ${compareStatusLabel}` : compareStatusLabel;

    return (
        <span data-component={DIFF_STATUS_BADGE_NAME} className={cn('flex items-center gap-x-2 text-sm overflow-hidden', className)}>
            <span className={cn('capitalize group-data-[tone=inverse]:text-alt', isOnline && 'text-success', className)}>
                {publishStatusLabel}
            </span>
            {hasDiff && (
                <span className='text-subtle group-data-[tone=inverse]:text-alt italic capitalize border-l-1 border-bdr-subtle pl-2'>{compareStatusLabels}</span>
            )}
            {workflowStatus && !(isOnline && workflowStatus === WorkflowStateStatus.READY) && (
                <span className="inline-flex items-center gap-x-1 overflow-hidden border-l-1 border-bdr-subtle pl-2 text-nowrap">
                    <StatusIcon status={workflowStatus} aria-label={workflowStatusLabel} className="shrink-0" />
                    <span className="text-nowrap truncate">{workflowStatusLabel}</span>
                </span>
            )}
        </span>
    );
};

DiffStatusBadge.displayName = DIFF_STATUS_BADGE_NAME;
