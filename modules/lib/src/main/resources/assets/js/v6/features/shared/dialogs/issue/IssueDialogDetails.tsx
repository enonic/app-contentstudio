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
import {IssueCommentDeleteDialog} from './comment/IssueCommentDeleteDialog';
import {IssueDialogDetailsContent} from './IssueDialogDetailsContent';

const ISSUE_DIALOG_DETAILS_NAME = 'IssueDialogDetails';

export const IssueDialogDetails = (): ReactElement => {
    const {open, view} = useStore($issueDialog, {keys: ['open', 'view']});
    const {open: confirmOpen, commentId} = useStore($deleteCommentConfirmation);
    const isOpen = open && view === 'details';

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
            <Dialog.Root data-component={ISSUE_DIALOG_DETAILS_NAME} open={isOpen} onOpenChange={handleOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay/>
                    <IssueDialogDetailsContent/>
                </Dialog.Portal>
            </Dialog.Root>

            <IssueCommentDeleteDialog
                open={confirmOpen}
                onOpenChange={handleConfirmOpenChange}
                onConfirm={() => void handleConfirmDelete()}
                title={confirmDeleteTitle}
                description={confirmDeleteDescription}
            />
        </>
    );
};

IssueDialogDetails.displayName = ISSUE_DIALOG_DETAILS_NAME;
