import {useMemo} from 'react';
import {ContentVersion} from '../../../../../../app/ContentVersion';
import {getIconForOperation} from '../../../../store/context/versionStore';

const COMPONENT_NAME = 'VersionsListItemIcon';

export type VersionsListItemIconProps = {
    version: ContentVersion;
}

export const VersionsListItemIcon = ({version}: VersionsListItemIconProps): React.ReactElement => {
    const Icon = getIconForOperation(version);

    return (
        <div className='w-7.5 h-full flex justify-center items-center' data-component={COMPONENT_NAME}>
            <Icon size={20} />
        </div>
    );
};

VersionsListItemIcon.displayName = COMPONENT_NAME;
