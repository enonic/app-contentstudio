import {type ReactElement} from 'react';
import {DeleteSettingsDialog} from '../../shared/dialogs/DeleteSettingsDialog';
import {ProjectDialog} from '../../shared/dialogs/project/ProjectDialog';
import {LegacyElement} from '../../shared/LegacyElement';

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
    }
}
