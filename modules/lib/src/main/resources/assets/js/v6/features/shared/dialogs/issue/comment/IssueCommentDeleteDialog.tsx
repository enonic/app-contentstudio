import {type ReactElement, type RefObject, useCallback} from 'react';
import {ConfirmationDialog} from '../../ConfirmationDialog';

export type IssueCommentDeleteDialogProps = {
    open: boolean;
    title: string;
    description: string;
    portalContainer?: HTMLElement | null;
    returnFocusRef?: RefObject<HTMLElement>;
    onOpenChange: (next: boolean) => void;
    onConfirm: () => void;
};

const ISSUE_COMMENT_DELETE_DIALOG_NAME = 'IssueCommentDeleteDialog';

export const IssueCommentDeleteDialog = ({
    open,
    title,
    description,
    portalContainer,
    returnFocusRef,
    onOpenChange,
    onConfirm,
}: IssueCommentDeleteDialogProps): ReactElement => {
    const handleCloseAutoFocus = useCallback((event: Event): void => {
        if (!returnFocusRef?.current) {
            return;
        }
        event.preventDefault();
        returnFocusRef.current.focus();
    }, [returnFocusRef]);

    return (
        <ConfirmationDialog.Root open={open} onOpenChange={onOpenChange}>
            <ConfirmationDialog.Portal container={portalContainer ?? undefined}>
                <ConfirmationDialog.Overlay />
                <ConfirmationDialog.Content onCloseAutoFocus={handleCloseAutoFocus}>
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
