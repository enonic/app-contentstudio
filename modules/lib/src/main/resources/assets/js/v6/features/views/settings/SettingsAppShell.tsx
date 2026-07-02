import { type ReactElement } from 'react';
import { DeleteSettingsDialog } from '../../shared/dialogs/DeleteSettingsDialog';
import { ProjectDialog } from '../../shared/dialogs/project/ProjectDialog';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { LegacyElement } from '../../../shared/ui/LegacyElement';
import { $projects } from '../../../entities/project';

export const SettingsAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <ProjectDialog />
            <DeleteSettingsDialog />
        </>
    );
};

SettingsAppShell.displayName = 'SettingsAppShell';

export class SettingsAppShellElement extends LegacyElement<typeof SettingsAppShell, {}> {
    constructor() {
        super({}, SettingsAppShell);
        setActiveProjectResolver(() => $projects.get().activeProjectId);
    }
}
