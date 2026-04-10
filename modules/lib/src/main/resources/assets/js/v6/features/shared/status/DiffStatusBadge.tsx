import {cn} from '@enonic/ui';
import {CompareStatus, CompareStatusChecker} from '../../../../app/content/CompareStatus';
import {PublishStatus} from '../../../../app/publish/PublishStatus';
import {useI18n} from '../../hooks/useI18n';
import type {ContentState} from '../../../../app/content/ContentState';
import {createCompareStatusKey, createPublishStatusKey} from '../../utils/cms/content/status';

type Props = {
    publishStatus: PublishStatus;
    compareStatus: CompareStatus;
    contentState?: ContentState;
    wasPublished: boolean;
    className?: string;
}

const DIFF_STATUS_BADGE_NAME = 'DiffStatusBadge';

export const DiffStatusBadge = ({
    publishStatus,
    compareStatus,
    contentState,
    wasPublished,
    className,
}: Props) => {
    const isOnline = publishStatus === PublishStatus.ONLINE;
    const isMovedAndModified = CompareStatusChecker.isMovedAndModified(compareStatus, contentState);
    const hasDiff = compareStatus !== CompareStatus.EQUAL;

    const publishStatusLabel = useI18n(createPublishStatusKey(publishStatus));
    const modifiedLabel = useI18n('status.modified');
    const compareStatusLabel = useI18n(createCompareStatusKey(compareStatus, wasPublished));
    const compareStatusLabels = isMovedAndModified ? `${modifiedLabel}, ${compareStatusLabel}` : compareStatusLabel;

    return (
        <span data-component={DIFF_STATUS_BADGE_NAME} className={cn('flex items-center gap-x-2 text-sm overflow-hidden', className)}>
            <span className={cn('capitalize group-data-[tone=inverse]:text-alt', isOnline && 'text-success', className)}>
                {publishStatusLabel}
            </span>
            {hasDiff && (
                <span className='text-subtle group-data-[tone=inverse]:text-alt italic capitalize border-l-1 border-bdr-subtle pl-2'>{compareStatusLabels}</span>
            )}
        </span>
    );
};

DiffStatusBadge.displayName = DIFF_STATUS_BADGE_NAME;
