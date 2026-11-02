import { type ReactElement } from 'react';
import { ProjectDialog } from '../../features/manage-project/ui/ProjectDialog';
import { DeleteSettingsDialog } from './ui/DeleteSettingsDialog';
import { SettingsBrowsePanel } from './ui/SettingsBrowsePanel';

export const SettingsPage = (): ReactElement => {
    return (
        <>
            <SettingsBrowsePanel />
            <ProjectDialog />
            <DeleteSettingsDialog />
        </>
    );
};

SettingsPage.displayName = 'SettingsPage';
