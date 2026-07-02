import { initBuiltInTypes } from '@enonic/lib-admin-ui/form2';
import { type ReactElement } from 'react';
import { registerContentStudioInputTypes } from '../../features/shared/form/input-types';
import { DeleteSettingsDialog } from './ui/DeleteSettingsDialog';
import { ProjectDialog } from '../../features/manage-project/ui/ProjectDialog';
import { setActiveProjectResolver } from '../../shared/lib/url/cms';
import { LegacyElement } from '../../shared/ui/LegacyElement';
import { $projects } from '../../entities/project';

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
        initBuiltInTypes();
        registerContentStudioInputTypes();
        setActiveProjectResolver(() => $projects.get().activeProjectId);
    }
}
