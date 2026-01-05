import type {ReactElement} from 'react';
import {ProjectSelectionDialog} from '../../../shared/dialogs/ProjectSelectionDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';
import {DuplicateDialog} from '../../../shared/dialogs/duplicate/DuplicateDialog';
import {IssueDialog} from '../../../shared/dialogs/issue/IssueDialog';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {UnpublishDialog} from '../../../shared/dialogs/unpublish/UnpublishDialog';

export const BrowseAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <ProjectSelectionDialog/>
            <PublishDialog/>
            <UnpublishDialog/>
            <DeleteDialog/>
            <DuplicateDialog/>
            <IssueDialog/>
        </>
    );
};

BrowseAppShell.displayName = 'BrowseAppShell';
