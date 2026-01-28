import {type ReactElement} from 'react';
import {ConfirmationDialog} from '../../ConfirmationDialog';

export type IssueCommentDeleteDialogProps = {
    open: boolean;
    title: string;
    description: string;
    onOpenChange: (next: boolean) => void;
    onConfirm: () => void;
};

const ISSUE_COMMENT_DELETE_DIALOG_NAME = 'IssueCommentDeleteDialog';

export const IssueCommentDeleteDialog = ({
    open,
    title,
    description,
    onOpenChange,
    onConfirm,
}: IssueCommentDeleteDialogProps): ReactElement => {
    return (
        <ConfirmationDialog.Root open={open} onOpenChange={onOpenChange}>
            <ConfirmationDialog.Portal>
                <ConfirmationDialog.Overlay className='z-40 bg-transparent' />
                <ConfirmationDialog.Content>
                    <ConfirmationDialog.DefaultHeader title={title} />
                    <ConfirmationDialog.Body>{description}</ConfirmationDialog.Body>
                    <ConfirmationDialog.Footer
                        intent='danger'
                        onConfirm={onConfirm}
                    />
                </ConfirmationDialog.Content>
            </ConfirmationDialog.Portal>
        </ConfirmationDialog.Root>
    );
};

IssueCommentDeleteDialog.displayName = ISSUE_COMMENT_DELETE_DIALOG_NAME;
