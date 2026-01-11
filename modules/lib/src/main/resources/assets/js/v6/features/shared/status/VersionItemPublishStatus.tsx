import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {ContentVersion} from '../../../../app/ContentVersion';
import {useI18n} from '../../hooks/useI18n';
import {OfflineIcon} from '../icons/OfflineIcon';
import {$latestPublishedVersion, getVersionPublishStatus, VersionPublishStatus} from '../../store/context/versionStore';

type VersionItemPublishStatusProps = {
    version: ContentVersion | null;
    className?: string;
};

export const VersionItemPublishStatus = ({version, className}: VersionItemPublishStatusProps): ReactElement | null => {
    const onlineLabel = useI18n('status.online');
    const expiredLabel = useI18n('status.expired');
    const scheduledLabel = useI18n('status.scheduled');
    const latestPublishedVersion = useStore($latestPublishedVersion);

    if (!version) {
        return null;
    }

    const publishStatus = getVersionPublishStatus(version, latestPublishedVersion);

    switch (publishStatus) {
    case VersionPublishStatus.ONLINE:
        return (
            <div className={cn('text-sm flex items-center text-success', className)}>
                {onlineLabel}
            </div>
        );

    case VersionPublishStatus.WAS_ONLINE:
        return (
            <OfflineIcon className={cn('shrink-0 w-4 bg-transparent', className)}/>
        );

    case VersionPublishStatus.EXPIRED:
        return (
            <div className={cn('text-sm flex items-center text-red-400', className)}>
                {expiredLabel}
            </div>
        );

    case VersionPublishStatus.SCHEDULED:
        return (
            <div className={cn('text-sm flex items-center text-orange-400', className)}>
                {scheduledLabel}
            </div>
        );

    default:
        return null;
    }
};

VersionItemPublishStatus.displayName = 'VersionItemPublishStatus';
