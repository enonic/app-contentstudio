import type {ReactElement} from 'react';
import {ProjectSelectionDialog} from '../../../shared/dialogs/ProjectSelectionDialog';
import {CompareVersionsDialog} from '../../../shared/dialogs/compare-versions/CompareVersionsDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';
import {DuplicateDialog} from '../../../shared/dialogs/duplicate/DuplicateDialog';
import {IssueDialog} from '../../../shared/dialogs/issue/IssueDialog';
import {NewContentDialog} from '../../../shared/dialogs/new-content/NewContentDialog';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {UnpublishDialog} from '../../../shared/dialogs/unpublish/UnpublishDialog';

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
            <IssueDialog />
            <CompareVersionsDialog />
        </>
    );
};

BrowseAppShell.displayName = 'BrowseAppShell';
