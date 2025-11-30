import type {ReactElement} from 'react';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';

export const WizardAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <PublishDialog />
            <DeleteDialog />
        </>
    );
};

WizardAppShell.displayName = 'WizardAppShell';
