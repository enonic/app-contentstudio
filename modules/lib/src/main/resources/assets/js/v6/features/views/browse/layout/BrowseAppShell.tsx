import type {ReactElement} from 'react';
import {ProjectSelectionDialog} from '../../../shared/dialogs/ProjectSelectionDialog';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {UnpublishDialog} from '../../../shared/dialogs/unpublish/UnpublishDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';
import {MoveDialog} from '../../../shared/dialogs/move/MoveDialog';

export const BrowseAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <ProjectSelectionDialog />
            <PublishDialog />
            <UnpublishDialog />
            <DeleteDialog />
            <MoveDialog />
        </>
    );
};

BrowseAppShell.displayName = 'BrowseAppShell';
