import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useTaskProgress} from '../../../hooks/useTaskProgress';
import {
    $deleteDialog,
    $deleteItemsCount,
    $deleteTaskId,
    $isDeleteTargetSite,
    cancelDeleteDialog,
    executeDeleteDialogAction,
    type DeleteAction
} from '../../../store/dialogs/deleteDialog.store';
import {DialogPresetGatedConfirmContent} from '../DialogPreset';
import {DeleteDialogMainContent} from './DeleteDialogMainContent';
import {DeleteDialogProgressContent} from './DeleteDialogProgressContent';

type View = 'main' | 'confirmation' | 'progress';

const DELETE_DIALOG_NAME = 'DeleteDialog';

export const DeleteDialog = (): ReactElement => {
    const {
        open,
        pendingAction,
        pendingTotal,
    } = useStore($deleteDialog, {keys: ['open', 'pendingAction', 'pendingTotal']});
    const total = useStore($deleteItemsCount);
    const hasSite = useStore($isDeleteTargetSite);
    const taskId = useStore($deleteTaskId);
    const {progress} = useTaskProgress(taskId);

    const [confirmAction, setConfirmAction] = useState<DeleteAction>('delete');
    const [view, setView] = useState<View>('main');

    const confirmDeleteTitle = useI18n('dialog.confirmDelete');
    const confirmDeleteDescription = useI18n('dialog.confirmDelete.subname');
    const confirmArchiveTitle = useI18n('dialog.confirmArchive');
    const confirmArchiveDescription = useI18n('dialog.confirmArchive.subname');

    const confirmTitle = confirmAction === 'archive' ? confirmArchiveTitle : confirmDeleteTitle;
    const confirmDescription = confirmAction === 'archive' ? confirmArchiveDescription : confirmDeleteDescription;

    const progressAction = pendingAction ?? confirmAction;
    const progressTotal = Math.max(1, pendingTotal || total || 1);

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
        setView('progress');
        const started = await executeDeleteDialogAction('delete');
        if (!started) {
            setView('main');
        }
    };

    const handleArchive = async () => {
        if (total > 1 || hasSite) {
            openConfirm('archive');
            return;
        }
        setView('progress');
        const started = await executeDeleteDialogAction('archive');
        if (!started) {
            setView('main');
        }
    };

    const handleConfirm = async () => {
        setView('progress');
        const started = await executeDeleteDialogAction(confirmAction);
        if (!started) {
            setView('main');
        }
        // resetView();
    };

    useEffect(() => {
        if (!open) {
            resetView();
        }
    }, [open]);

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
                {view === 'progress' && (
                    <DeleteDialogProgressContent
                        action={progressAction}
                        total={progressTotal}
                        progress={progress}
                    />
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

DeleteDialog.displayName = DELETE_DIALOG_NAME;
