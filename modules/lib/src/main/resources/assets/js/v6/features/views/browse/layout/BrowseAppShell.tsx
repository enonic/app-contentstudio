import type {ReactElement} from 'react';
import {ProjectSelectionDialog} from '../../../shared/dialogs/ProjectSelectionDialog';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {UnpublishDialog} from '../../../shared/dialogs/unpublish/UnpublishDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';
import {DuplicateDialog} from '../../../shared/dialogs/duplicate/DuplicateDialog';
import {NewContentDialog} from '../../../shared/dialogs/new-content/NewContentDialog';

export const BrowseAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <NewContentDialog />
            <ProjectSelectionDialog />
            <PublishDialog />
            <UnpublishDialog />
            <DeleteDialog />
            <DuplicateDialog />
        </>
    );
};

BrowseAppShell.displayName = 'BrowseAppShell';
