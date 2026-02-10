import type {ReactElement} from 'react';
import {CompareVersionsDialog} from '../../../shared/dialogs/compare-versions/CompareVersionsDialog';
import {DeleteDialog} from '../../../shared/dialogs/delete/DeleteDialog';
import {DuplicateDialog} from '../../../shared/dialogs/duplicate/DuplicateDialog';
import {IssueDialog} from '../../../shared/dialogs/issue/IssueDialog';
import {NewIssueDialog} from '../../../shared/dialogs/new-issue/NewIssueDialog';
import {MoveDialog} from '../../../shared/dialogs/move/MoveDialog';
import {PublishDialog} from '../../../shared/dialogs/publish/PublishDialog';
import {RequestPublishDialog} from '../../../shared/dialogs/requestPublish/RequestPublishDialog';
import {UnpublishDialog} from '../../../shared/dialogs/unpublish/UnpublishDialog';

export const WizardAppShell = (): ReactElement => {
    return (
        <>
            {/* Shared dialogs */}
            <PublishDialog />
            <RequestPublishDialog />
            <UnpublishDialog />
            <DeleteDialog />
            <DuplicateDialog />
            <MoveDialog />
            <IssueDialog />
            <NewIssueDialog />
            <CompareVersionsDialog />
        </>
    );
};

WizardAppShell.displayName = 'WizardAppShell';
