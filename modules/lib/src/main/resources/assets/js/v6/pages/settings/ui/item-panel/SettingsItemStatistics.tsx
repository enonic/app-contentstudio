import { ObjectHelper } from '@enonic/lib-admin-ui/ObjectHelper';
import { ReactElement } from 'react';
import { FolderViewItem } from '../../../../../app/settings/view/FolderViewItem';
import { ProjectViewItem } from '../../../../../app/settings/view/ProjectViewItem';
import { SettingsViewItem } from '../../../../../app/settings/view/SettingsViewItem';
import { SETTINGS_PROJECTS_FOLDER_ID } from '../../model/settings-tree.store';
import { FolderStatistics } from './FolderStatistics';
import { ProjectDag } from './project-dag/ProjectDag';
import { ProjectStatistics } from './ProjectStatistics';

type SettingsItemStatisticsProps = {
    item: SettingsViewItem;
};

const SETTINGS_ITEM_STATISTICS_NAME = 'SettingsItemStatistics';

export const SettingsItemStatistics = ({ item }: SettingsItemStatisticsProps): ReactElement => {
    const isProjectViewItem = ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem);
    const isFolderViewItem = ObjectHelper.iFrameSafeInstanceOf(item, FolderViewItem);
    const showDAG = item.getId() === SETTINGS_PROJECTS_FOLDER_ID;

    return (
        <div data-component={SETTINGS_ITEM_STATISTICS_NAME} className="flex flex-col gap-7">
            {isProjectViewItem && <ProjectStatistics item={item as ProjectViewItem} />}
            {isFolderViewItem && <FolderStatistics item={item as FolderViewItem} />}
            {showDAG && <ProjectDag />}
        </div>
    );
};

SettingsItemStatistics.displayName = SETTINGS_ITEM_STATISTICS_NAME;
