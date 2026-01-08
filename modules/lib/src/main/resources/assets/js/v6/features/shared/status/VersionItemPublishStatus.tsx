import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {ContentVersion} from '../../../../app/ContentVersion';
import {useI18n} from '../../hooks/useI18n';
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
    const commonClassName = 'text-sm flex items-center truncate inline-block';

    if (!version) {
        return null;
    }

    const publishStatus = getVersionPublishStatus(version);

    switch (publishStatus) {
        case VersionPublishStatus.ONLINE:
            return (latestPublishedVersion?.getId() === version.getId() ?
                <div className={cn(commonClassName, 'text-success', className)}>
                    {onlineLabel}
                </div>
                : null);

        case VersionPublishStatus.EXPIRED:
            return (
                <div className={cn(commonClassName, 'text-red-400', className)}>
                    {expiredLabel}
                </div>
            );

        case VersionPublishStatus.SCHEDULED:
            return (
                <div className={cn(commonClassName, 'text-orange-400', className)}>
                    {scheduledLabel}
                </div>
            );

        default:
            return null;
    }
};

VersionItemPublishStatus.displayName = 'VersionItemPublishStatus';
