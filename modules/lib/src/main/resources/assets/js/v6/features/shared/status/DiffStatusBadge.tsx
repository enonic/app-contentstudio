import {cn} from '@enonic/ui';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {PublishStatus} from '../../../../app/publish/PublishStatus';
import {useI18n} from '../../hooks/useI18n';
import {calcSecondaryStatus, calcTreePublishStatus, createPublishStatusKey, createSecondaryStatusKey} from '../../utils/cms/content/status';

type Props = {
    contentSummary: ContentSummary;
    secondaryStatusOverride?: string;
    className?: string;
}

const DIFF_STATUS_BADGE_NAME = 'DiffStatusBadge';

export const DiffStatusBadge = ({contentSummary, secondaryStatusOverride, className}: Props) => {
    const publishStatus = calcTreePublishStatus(contentSummary);
    const isOnline = publishStatus === PublishStatus.ONLINE;
    const secondaryStatus = calcSecondaryStatus(publishStatus, contentSummary);
    const effectiveSecondaryLabel = secondaryStatusOverride ?? undefined;

    const publishStatusLabel = useI18n(createPublishStatusKey(publishStatus));
    const secondaryStatusLabel = useI18n(secondaryStatus ? createSecondaryStatusKey(secondaryStatus) : '');

    const displaySecondaryLabel = effectiveSecondaryLabel ?? secondaryStatusLabel;
    const hasSecondary = secondaryStatusOverride != null || secondaryStatus != null;

    return (
        <span data-component={DIFF_STATUS_BADGE_NAME} className={cn('flex items-center gap-x-2 text-sm overflow-hidden', className)}>
            <span className={cn('capitalize group-data-[tone=inverse]:text-alt', isOnline && 'text-success', className)}>
                {publishStatusLabel}
            </span>
            {hasSecondary && (
                <span className='text-subtle group-data-[tone=inverse]:text-alt italic capitalize border-l-1 border-bdr-subtle pl-2'>{displaySecondaryLabel}</span>
            )}
        </span>
    );
};

DiffStatusBadge.displayName = DIFF_STATUS_BADGE_NAME;
