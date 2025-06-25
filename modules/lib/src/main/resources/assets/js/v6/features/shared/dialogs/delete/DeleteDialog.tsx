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
} from '../../../store/dialogs/deleteDialog.store';
import {DialogPresetGatedConfirmContent} from '../DialogPreset';
import {DeleteDialogMainContent} from './DeleteDialogMainContent';
import {DeleteDialogProgressContent} from './DeleteDialogProgressContent';

type View = 'main' | 'confirmation' | 'progress';

const DELETE_DIALOG_NAME = 'DeleteDialog';

export const DeleteDialog = (): ReactElement => {
    const {
        open,
        pendingTotal,
    } = useStore($deleteDialog, {keys: ['open', 'pendingTotal']});
    const total = useStore($deleteItemsCount);
    const hasSite = useStore($isDeleteTargetSite);
    const taskId = useStore($deleteTaskId);
    const {progress} = useTaskProgress(taskId);

    const [view, setView] = useState<View>('main');

    const confirmDeleteTitle = useI18n('dialog.confirmDelete');
    const confirmDeleteDescription = useI18n('dialog.confirmArchive.subname');

    const progressTotal = Math.max(1, pendingTotal || total || 1);

    const resetView = () => {
        setView('main');
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            cancelDeleteDialog();
            resetView();
        }
    };

    const openConfirm = () => {
        setView('confirmation');
    };

    const handleArchive = async () => {
        if (total > 1 || hasSite) {
            openConfirm();
            return;
        }
        setView('progress');
        const started = await executeDeleteDialogAction();
        if (!started) {
            setView('main');
        }
    };

    const handleConfirm = async () => {
        setView('progress');
        const started = await executeDeleteDialogAction();
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
                        onArchive={() => void handleArchive()}
                    />
                }
                {view === 'confirmation' && <DialogPresetGatedConfirmContent
                    className="sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
                    title={confirmDeleteTitle}
                    description={confirmDeleteDescription}
                    expected={total}
                    onConfirm={() => void handleConfirm()}
                    onCancel={resetView}
                />}
                {view === 'progress' && (
                    <DeleteDialogProgressContent
                        total={progressTotal}
                        progress={progress}
                    />
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

DeleteDialog.displayName = DELETE_DIALOG_NAME;
