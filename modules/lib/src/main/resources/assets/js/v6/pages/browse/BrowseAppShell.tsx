import type { ReactElement } from 'react';
import { CompareVersionsDialog } from '../../widgets/context-panel/widget/versions/compare/CompareVersionsDialog';
import { DeleteDialog } from '../../features/delete/ui/DeleteDialog';
import { DuplicateDialog } from '../../features/duplicate/ui/DuplicateDialog';
import { IssueDialog } from '../../features/issues/ui/issue/IssueDialog';
import { NewContentDialog } from '../../features/new-content/ui/NewContentDialog';
import { MoveDialog } from '../../features/move/ui/MoveDialog';
import { NewIssueDialog } from '../../features/issues/ui/new-issue/NewIssueDialog';
import { ProjectDialog } from '../../features/manage-project/ui/ProjectDialog';
import { ProjectSelectionDialog } from '../../features/manage-project/ui/ProjectSelectionDialog';
import { PublishDialog } from '../../features/publish/ui/PublishDialog';
import { RequestPublishDialog } from '../../features/request-publish/ui/RequestPublishDialog';
import { SortDialog } from '../../features/sort/ui/SortDialog';
import { UnpublishDialog } from '../../features/unpublish/ui/UnpublishDialog';
import { PermissionsDialog } from '../../features/permissions/ui/PermissionsDialog';

export const BrowseAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <CompareVersionsDialog />
            <DeleteDialog />
            <DuplicateDialog />
            <IssueDialog />
            <MoveDialog />
            <NewContentDialog />
            <NewIssueDialog />
            <ProjectDialog />
            <ProjectSelectionDialog />
            <PermissionsDialog />
            <PublishDialog />
            <RequestPublishDialog />
            <SortDialog />
            <UnpublishDialog />
        </>
    );
};

BrowseAppShell.displayName = 'BrowseAppShell';
