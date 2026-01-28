import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useCallback} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {closeIssueDialog, $issueDialog} from '../../../store/dialogs/issueDialog.store';
import {
    $deleteCommentConfirmation,
    closeDeleteCommentConfirmation,
    deleteIssueDialogComment,
    isDeleteCommentConfirmationOpen,
} from '../../../store/dialogs/issueDialogDetails.store';
import {resetNewIssueDialogContext} from '../../../store/dialogs/newIssueDialog.store';
import {IssueCommentDeleteDialog} from './comment/IssueCommentDeleteDialog';
import {IssueDialogDetailsContent} from './IssueDialogDetailsContent';
import {IssueDialogListContent} from './IssueDialogListContent';
import {NewIssueDialogContent} from './NewIssueDialogContent';

const ISSUE_DIALOG_NAME = 'IssueDialog';

export const IssueDialog = (): ReactElement => {
    const {open, view} = useStore($issueDialog, {keys: ['open', 'view']});
    const {open: confirmOpen, commentId} = useStore($deleteCommentConfirmation);

    const confirmDeleteTitle = useI18n('dialog.confirmDelete');
    const confirmDeleteDescription = useI18n('dialog.issue.confirmCommentDelete');

    const handleOpenChange = (next: boolean): void => {
        if (next) {
            return;
        }
        if (isDeleteCommentConfirmationOpen()) {
            return;
        }
        closeIssueDialog();
        resetNewIssueDialogContext();
    };

    const handleConfirmDelete = useCallback(async (): Promise<void> => {
        if (!commentId) {
            return;
        }
        const result = await deleteIssueDialogComment(commentId);
        if (result !== false) {
            closeDeleteCommentConfirmation();
        }
    }, [commentId]);

    const handleConfirmOpenChange = useCallback((nextOpen: boolean): void => {
        if (!nextOpen) {
            closeDeleteCommentConfirmation();
        }
    }, []);

    return (
        <>
            <Dialog.Root data-component={ISSUE_DIALOG_NAME} open={open} onOpenChange={handleOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay/>
                    {view === 'list' && <IssueDialogListContent/>}
                    {view === 'details' && <IssueDialogDetailsContent/>}
                    {view === 'new-issue' && <NewIssueDialogContent/>}
                </Dialog.Portal>
            </Dialog.Root>

            {view === 'details' && (
                <IssueCommentDeleteDialog
                    open={confirmOpen}
                    onOpenChange={handleConfirmOpenChange}
                    onConfirm={() => void handleConfirmDelete()}
                    title={confirmDeleteTitle}
                    description={confirmDeleteDescription}
                />
            )}
        </>
    );
};

IssueDialog.displayName = ISSUE_DIALOG_NAME;
