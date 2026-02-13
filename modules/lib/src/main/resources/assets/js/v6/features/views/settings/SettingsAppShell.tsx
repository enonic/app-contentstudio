import {type ReactElement} from 'react';
import {DeleteSettingsDialog} from '../../shared/dialogs/DeleteSettingsDialog';
import {NewProjectDialog} from '../../shared/dialogs/new-project/NewProjectDialog';
import {LegacyElement} from '../../shared/LegacyElement';

export const SettingsAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <NewProjectDialog />
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
