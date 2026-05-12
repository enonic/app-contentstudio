import {type ReactElement} from 'react';
import {useI18n} from '../../../../../hooks/useI18n';
import {ConfirmationDialog} from '../../../../../shared/dialogs/ConfirmationDialog';
import {useRevertActions} from './useRevertActions';

export const RevertPatchConfirmationDialog = (): ReactElement | null => {
    const title = useI18n('dialog.revert.patch.title');
    const message = useI18n('dialog.revert.patch.message');
    const revertActions = useRevertActions();

    if (!revertActions) {
        return null;
    }

    return (
        <ConfirmationDialog.Root open onOpenChange={(open) => !open && revertActions.cancelRevert()}>
            <ConfirmationDialog.Portal>
                <ConfirmationDialog.Overlay />
                <ConfirmationDialog.Content>
                    <ConfirmationDialog.DefaultHeader title={title} />
                    <ConfirmationDialog.Body>{message}</ConfirmationDialog.Body>
                    <ConfirmationDialog.Footer
                        onConfirm={revertActions.confirmRevert}
                        onCancel={revertActions.cancelRevert}
                        intent='danger'
                    />
                </ConfirmationDialog.Content>
            </ConfirmationDialog.Portal>
        </ConfirmationDialog.Root>
    );
};
