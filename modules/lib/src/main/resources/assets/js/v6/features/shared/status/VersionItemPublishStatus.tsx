import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Cloud} from 'lucide-react';
import {ReactElement, useMemo} from 'react';
import {ContentVersion} from '../../../../app/ContentVersion';
import {useI18n} from '../../hooks/useI18n';
import {
    $publishBadgeByVersionId,
    VersionPublishStatus,
} from '../../store/context/versionPublishState';

type VersionItemPublishStatusProps = {
    version: ContentVersion | null;
    className?: string;
};

export const VersionItemPublishStatus = ({version, className}: VersionItemPublishStatusProps): ReactElement | null => {
    const onlineLabel = useI18n('status.online');
    const expiredLabel = useI18n('status.expired');
    const scheduledLabel = useI18n('status.scheduled');
    const badges = useStore($publishBadgeByVersionId);
    const commonClassName = 'text-sm items-center truncate group-data-[tone=inverse]:text-alt';

    const versionId = version?.getId();

    const badge = useMemo(
        () => (versionId ? badges.get(versionId) : undefined),
        [versionId, badges],
    );

    if (!version || !badge) {
        return null;
    }

    if (badge.isOnline) {
        switch (badge.status) {
            case VersionPublishStatus.PUBLISHED:
                return <div className={cn(commonClassName, 'text-success', className)}>{onlineLabel}</div>;
            case VersionPublishStatus.EXPIRED:
                return <div className={cn(commonClassName, 'text-danger', className)}>{expiredLabel}</div>;
            case VersionPublishStatus.SCHEDULED:
                return <div className={cn(commonClassName, 'text-warn', className)}>{scheduledLabel}</div>;
            default:
                return null;
        }
    }

    return <Cloud className={cn('w-4 h-4 shrink-0', className)} />;
};

VersionItemPublishStatus.displayName = 'VersionItemPublishStatus';
