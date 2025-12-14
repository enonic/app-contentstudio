import {IconButton} from '@enonic/ui';
import {Globe, PenLine} from 'lucide-react';
import {useMemo} from 'react';
import {ContentVersion} from '../../../../../../app/ContentVersion';
import {useI18n} from '../../../../hooks/useI18n';
import {getVersionPublishStatus} from '../../../../store/context/versionStore';

export type VersionsListItemPublishStatusProps = {
    version: ContentVersion;
}

export const VersionsListItemPublishStatus = ({version}: VersionsListItemPublishStatusProps): React.ReactElement => {
    const publishStatus = useMemo(() => getVersionPublishStatus(version), [version]);

    if (publishStatus === 'online') {
        return (
            <div className='text-sm flex items-center text-success'>
                {useI18n('status.online')}
            </div>
        );
    }

    if (publishStatus === 'was_online') {
        return (
            <IconButton icon={Globe} size={'sm'} className='shrink-0 w-4 bg-transparent'/>
        );
    }

    return null;
}
