import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {
    $moveDialog,
    cancelMoveDialog,
} from '../../../store/dialogs/moveDialog.store';
import {MoveDialogMainContent} from './MoveDialogMainContent';

const MOVE_DIALOG_NAME = 'MoveDialog';

export const MoveDialog = (): ReactElement => {
    const {open} = useStore($moveDialog, {keys: ['open']});

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            cancelMoveDialog();
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <MoveDialogMainContent />
            </Dialog.Portal>
        </Dialog.Root>
    );
};

MoveDialog.displayName = MOVE_DIALOG_NAME;
