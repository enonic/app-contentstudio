import {useStore} from '@nanostores/preact';
import {ContentVersion} from '../../../../../../app/ContentVersion';
import {$latestPublishedVersion, $versions, getIconForOperation} from '../../../../store/context/versionStore';

const COMPONENT_NAME = 'VersionsListItemIcon';

export type VersionsListItemIconProps = {
    version: ContentVersion;
}

export const VersionsListItemIcon = ({version}: VersionsListItemIconProps): React.ReactElement => {
    const versions = useStore($versions);
    const latestPublishedVersion = useStore($latestPublishedVersion);
    const Icon = getIconForOperation(version, versions, latestPublishedVersion);

    return (
        <div className='w-7.5 h-full flex justify-center items-center' data-component={COMPONENT_NAME}>
            <Icon size={20} />
        </div>
    );
};

VersionsListItemIcon.displayName = COMPONENT_NAME;
