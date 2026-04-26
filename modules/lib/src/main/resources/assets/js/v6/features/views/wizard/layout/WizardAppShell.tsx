import type {ReactElement} from 'react';
import {CompareVersionsDialog} from '../../../shared/dialogs/compare-versions/CompareVersionsDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';
import {DuplicateDialog} from '../../../shared/dialogs/duplicate/DuplicateDialog';
import {IssueDialog} from '../../../shared/dialogs/issue/IssueDialog';
import {MoveDialog} from '../../../shared/dialogs/move/MoveDialog';
import {NewIssueDialog} from '../../../shared/dialogs/new-issue/NewIssueDialog';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {RequestPublishDialog} from '../../../shared/dialogs/requestPublish/RequestPublishDialog';
import {RenameContentDialog} from '../../../shared/dialogs/rename-content/RenameContentDialog';
import {SortDialog} from '../../../shared/dialogs/sort-dialog/SortDialog';
import {UnpublishDialog} from '../../../shared/dialogs/unpublish/UnpublishDialog';
import {PermissionsDialog} from '../../../shared/dialogs/permissions/PermissionsDialog';
import {NewContentDialog} from '../../../shared/dialogs/new-content/NewContentDialog';
import {DetachedPageComponentsView} from './DetachedPageComponentsView';

export const WizardAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <NewContentDialog />
            <PermissionsDialog />
            <CompareVersionsDialog />
            <DeleteDialog />
            <DuplicateDialog />
            <IssueDialog />
            <MoveDialog />
            <NewIssueDialog />
            <PublishDialog />
            <RequestPublishDialog />
            <RenameContentDialog />
            <UnpublishDialog />
            <SortDialog />
            <DetachedPageComponentsView />
        </>
    );
};

WizardAppShell.displayName = 'WizardAppShell';
