import {cn} from '@enonic/ui';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {PublishStatus} from '../../../../app/publish/PublishStatus';
import {useI18n} from '../../hooks/useI18n';
import {calcSecondaryStatus, calcTreePublishStatus, createPublishStatusKey, createSecondaryStatusKey, createContentStateKey} from '../../utils/cms/content/status';
import {calcContentState} from '../../utils/cms/content/workflow';
import {StatusIcon} from '../icons/StatusIcon';

type Props = {
    contentSummary: ContentSummary;
    secondaryStatusOverride?: string;
    className?: string;
}

const DIFF_STATUS_BADGE_NAME = 'DiffStatusBadge';

export const DiffStatusBadge = ({contentSummary, secondaryStatusOverride, className}: Props) => {
    const publishStatus = calcTreePublishStatus(contentSummary);
    const contentState = calcContentState(contentSummary);
    const isOnline = publishStatus === PublishStatus.ONLINE;
    const secondaryStatus = calcSecondaryStatus(publishStatus, contentSummary);
    const effectiveSecondaryLabel = secondaryStatusOverride ?? undefined;
    const hideContentState = isOnline && contentState === 'ready' && !secondaryStatus && !secondaryStatusOverride;

    const publishStatusLabel = useI18n(createPublishStatusKey(publishStatus));
    const secondaryStatusLabel = useI18n(secondaryStatus ? createSecondaryStatusKey(secondaryStatus) : '');
    const contentStateLabel = useI18n(createContentStateKey(contentState));

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
            {contentState && !hideContentState && (
                <span className="inline-flex items-center gap-x-1 overflow-hidden border-l-1 border-bdr-subtle pl-2 text-nowrap">
                    <StatusIcon status={contentState} aria-label={contentStateLabel} className="shrink-0" />
                    <span className="text-nowrap truncate">{contentStateLabel}</span>
                </span>
            )}
        </span>
    );
};

DiffStatusBadge.displayName = DIFF_STATUS_BADGE_NAME;
