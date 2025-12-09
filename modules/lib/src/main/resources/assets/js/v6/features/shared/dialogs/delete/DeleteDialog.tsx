import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $deleteDialog,
    $isDeleteDialogReady,
    $deleteItemsCount,
    $isDeleteTargetSite,
    cancelDeleteDialog,
    executeDeleteDialogAction,
    type DeleteAction,
} from '../../../store/dialogs/deleteDialog.store';
import {DialogPresetGatedConfirmContent} from '../DialogPreset';
import {DeleteDialogMainContent} from './DeleteDialogMainContent';
import {ProgressDialog} from '../ProgressDialog';
import {$progressValue} from '../../../store/dialogs/progress.store';

type View = 'main' | 'confirmation' | 'progress';

const DELETE_DIALOG_NAME = 'DeleteDialog';

type DeleteProgressViewProps = {
    title: string;
    description: string;
};

const DeleteProgressView = ({title, description}: DeleteProgressViewProps): ReactElement => {
    const progress = useStore($progressValue);

    return (
        <ProgressDialog
            title={title}
            description={description}
            progress={progress}
            contentClassName="w-full h-full gap-10 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
        />
    );
};

export const DeleteDialog = (): ReactElement => {
    const {
        open,
        // submitting,
        pendingAction,
        pendingTotal,
    } = useStore($deleteDialog, {keys: ['open', 'submitting', 'pendingAction', 'pendingTotal']});
    // const ready = useStore($isDeleteDialogReady);
    const total = useStore($deleteItemsCount);
    const hasSite = useStore($isDeleteTargetSite);
    // const progress = useStore($progressValue);

    const [confirmAction, setConfirmAction] = useState<DeleteAction>('delete');
    const [view, setView] = useState<View>('main');

    const confirmDeleteTitle = useI18n('dialog.confirmDelete');
    const confirmDeleteDescription = useI18n('dialog.confirmDelete.subname');
    const confirmArchiveTitle = useI18n('dialog.confirmArchive');
    const confirmArchiveDescription = useI18n('dialog.confirmArchive.subname');
    const progressTitle = (pendingAction ?? confirmAction) === 'archive' ? useI18n('dialog.archive.progress.title') : useI18n('dialog.delete.progress.title');
    const progressCount = Math.max(1, pendingTotal || total || 1);
    const progressDescription = (pendingAction ?? confirmAction) === 'archive'
        ? useI18n('dialog.archiving', progressCount)
        : useI18n('dialog.deleting', progressCount);

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

                {view === 'progress' && (
                    <DeleteProgressView
                        title={progressTitle}
                        description={progressDescription}
                    />
                )}

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
