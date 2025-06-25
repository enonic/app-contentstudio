import type {ReactElement} from 'react';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';

export const WizardAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <PublishDialog />
        </>
    );
};

WizardAppShell.displayName = 'WizardAppShell';
