import {ReactElement} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {ConfirmationDialog} from '../../../../shared/dialogs/ConfirmationDialog';
import {cancelRevert, confirmRevert} from '../../../../store/context/versionStore';

export const RevertPatchConfirmationDialog = (): ReactElement => {
    const title = useI18n('dialog.revert.patch.title');
    const message = useI18n('dialog.revert.patch.message');

    return (
        <ConfirmationDialog.Root open onOpenChange={(open) => !open && cancelRevert()}>
            <ConfirmationDialog.Portal>
                <ConfirmationDialog.Overlay />
                <ConfirmationDialog.Content>
                    <ConfirmationDialog.DefaultHeader title={title} />
                    <ConfirmationDialog.Body>{message}</ConfirmationDialog.Body>
                    <ConfirmationDialog.Footer onConfirm={confirmRevert} onCancel={cancelRevert} intent='danger' />
                </ConfirmationDialog.Content>
            </ConfirmationDialog.Portal>
        </ConfirmationDialog.Root>
    );
};
