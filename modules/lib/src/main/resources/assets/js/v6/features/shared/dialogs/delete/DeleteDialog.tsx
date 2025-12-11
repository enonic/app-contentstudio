import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $deleteDialog,
    $deleteItemsCount,
    $isDeleteTargetSite,
    cancelDeleteDialog,
    executeDeleteDialogAction,
    type DeleteAction,
} from '../../../store/dialogs/deleteDialog.store';
import {DialogPresetGatedConfirmContent} from '../DialogPreset';
import {DeleteDialogMainContent} from './DeleteDialogMainContent';

type View = 'main' | 'confirmation' | 'progress';

const DELETE_DIALOG_NAME = 'DeleteDialog';

export const DeleteDialog = (): ReactElement => {
    const {open} = useStore($deleteDialog, {keys: ['open']});
    const total = useStore($deleteItemsCount);
    const hasSite = useStore($isDeleteTargetSite);

    const [confirmAction, setConfirmAction] = useState<DeleteAction>('delete');
    const [view, setView] = useState<View>('main');

    const confirmDeleteTitle = useI18n('dialog.confirmDelete');
    const confirmDeleteDescription = useI18n('dialog.confirmDelete.subname');
    const confirmArchiveTitle = useI18n('dialog.confirmArchive');
    const confirmArchiveDescription = useI18n('dialog.confirmArchive.subname');

    const confirmTitle = confirmAction === 'archive' ? confirmArchiveTitle : confirmDeleteTitle;
    const confirmDescription = confirmAction === 'archive' ? confirmArchiveDescription : confirmDeleteDescription;

    const resetView = () => {
        setConfirmAction('delete');
        setView('main');
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            cancelDeleteDialog();
            resetView();
        }
    };

    const openConfirm = (action: DeleteAction) => {
        setConfirmAction(action);
        setView('confirmation');
    };

    const handleDelete = async () => {
        if (total > 1 || hasSite) {
            openConfirm('delete');
            return;
        }
        await executeDeleteDialogAction('delete');
    };

    const handleArchive = async () => {
        if (total > 1 || hasSite) {
            openConfirm('archive');
            return;
        }
        await executeDeleteDialogAction('archive');
    };

    const handleConfirm = async () => {
        await executeDeleteDialogAction(confirmAction);
        resetView();
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />

                {view === 'main' &&
                    <DeleteDialogMainContent
                        onDelete={() => void handleDelete()}
                        onArchive={() => void handleArchive()}
                    />
                }
                {view === 'confirmation' && <DialogPresetGatedConfirmContent
                    className="sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
                    title={confirmTitle}
                    description={confirmDescription}
                    expected={total}
                    onConfirm={() => void handleConfirm()}
                    onCancel={resetView}
                />}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

DeleteDialog.displayName = DELETE_DIALOG_NAME;
