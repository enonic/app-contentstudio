import type {ReactElement} from 'react';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {UnpublishDialog} from '../../../shared/dialogs/unpublish/UnpublishDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';

export const WizardAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <PublishDialog />
            <UnpublishDialog />
            <DeleteDialog />
        </>
    );
};

WizardAppShell.displayName = 'WizardAppShell';
