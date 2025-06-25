import type {ReactElement} from 'react';
import {ProjectSelectionDialog} from '../../../shared/dialogs/ProjectSelectionDialog';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';

export const BrowseAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <ProjectSelectionDialog />
            <PublishDialog />
            <DeleteDialog />
        </>
    );
};

BrowseAppShell.displayName = 'BrowseAppShell';
