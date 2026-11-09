import { type ReactElement } from 'react';
import { ProjectDialog } from '../../features/manage-project/ui/ProjectDialog';
import { NewContentDialog } from '../../features/new-content/ui/NewContentDialog';
import { DeleteSettingsDialog } from './ui/DeleteSettingsDialog';
import { SettingsBrowsePanel } from './ui/SettingsBrowsePanel';

export const SettingsPage = (): ReactElement => {
    return (
        <>
            <SettingsBrowsePanel />
            <ProjectDialog />
            <NewContentDialog />
            <DeleteSettingsDialog />
        </>
    );
};

SettingsPage.displayName = 'SettingsPage';
