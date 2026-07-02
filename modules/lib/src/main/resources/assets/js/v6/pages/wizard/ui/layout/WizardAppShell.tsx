import type { ReactElement } from 'react';
import { CompareVersionsDialog } from '../../../../widgets/context-panel/widget/versions/compare/CompareVersionsDialog';
import { DeleteDialog } from '../../../../features/delete/ui/DeleteDialog';
import { DuplicateDialog } from '../../../../features/duplicate/ui/DuplicateDialog';
import { IssueDialog } from '../../../../features/issues/ui/issue/IssueDialog';
import { MoveDialog } from '../../../../features/move/ui/MoveDialog';
import { NewIssueDialog } from '../../../../features/issues/ui/new-issue/NewIssueDialog';
import { PublishDialog } from '../../../../features/publish/ui/PublishDialog';
import { RequestPublishDialog } from '../../../../features/request-publish/ui/RequestPublishDialog';
import { RenameContentDialog } from '../../../../features/rename/ui/RenameContentDialog';
import { SortDialog } from '../../../../features/sort/ui/SortDialog';
import { UnpublishDialog } from '../../../../features/unpublish/ui/UnpublishDialog';
import { PermissionsDialog } from '../../../../features/permissions/ui/PermissionsDialog';
import { NewContentDialog } from '../../../../features/new-content/ui/NewContentDialog';
import { DetachedPageComponentsView } from './DetachedPageComponentsView';
import { PageResetDialog } from './PageResetDialog';

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
            <PageResetDialog />
            <DetachedPageComponentsView />
        </>
    );
};

WizardAppShell.displayName = 'WizardAppShell';
