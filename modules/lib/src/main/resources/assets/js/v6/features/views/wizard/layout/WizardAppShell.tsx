import type {ReactElement} from 'react';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {UnpublishDialog} from '../../../shared/dialogs/unpublish/UnpublishDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';
import {MoveDialog} from '../../../shared/dialogs/move/MoveDialog';

export const WizardAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <PublishDialog />
            <UnpublishDialog />
            <DeleteDialog />
            <MoveDialog />
        </>
    );
};

WizardAppShell.displayName = 'WizardAppShell';
