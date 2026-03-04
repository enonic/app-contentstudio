import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {ContentVersion} from '../../../../app/ContentVersion';
import {useI18n} from '../../hooks/useI18n';
import {
    $activePublishStatus,
    $activePublishVersionId,
    VersionPublishStatus,
} from '../../store/context/versionStore';

type VersionItemPublishStatusProps = {
    version: ContentVersion | null;
    className?: string;
};

export const VersionItemPublishStatus = ({version, className}: VersionItemPublishStatusProps): ReactElement | null => {
    const onlineLabel = useI18n('status.online');
    const expiredLabel = useI18n('status.expired');
    const scheduledLabel = useI18n('status.scheduled');
    const activePublishVersionId = useStore($activePublishVersionId);
    const publishStatus = useStore($activePublishStatus);
    const commonClassName = 'text-sm items-center truncate group-data-[tone=inverse]:text-alt';

    if (!version || version.getId() !== activePublishVersionId) {
        return null;
    }

    switch (publishStatus) {
        case VersionPublishStatus.PUBLISHED:
            return <div className={cn(commonClassName, 'text-success', className)}>{onlineLabel}</div>;
        case VersionPublishStatus.EXPIRED:
            return <div className={cn(commonClassName, 'text-danger', className)}>{expiredLabel}</div>;
        case VersionPublishStatus.SCHEDULED:
            return <div className={cn(commonClassName, 'text-warn', className)}>{scheduledLabel}</div>;
        default:
            return null;
    }
};

VersionItemPublishStatus.displayName = 'VersionItemPublishStatus';
