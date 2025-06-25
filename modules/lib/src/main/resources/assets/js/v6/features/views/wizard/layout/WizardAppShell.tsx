import type {ReactElement} from 'react';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {UnpublishDialog} from '../../../shared/dialogs/unpublish/UnpublishDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';
import {DuplicateDialog} from '../../../shared/dialogs/duplicate/DuplicateDialog';

export const WizardAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <PublishDialog />
            <UnpublishDialog />
            <DeleteDialog />
            <DuplicateDialog />
        </>
    );
};

WizardAppShell.displayName = 'WizardAppShell';
