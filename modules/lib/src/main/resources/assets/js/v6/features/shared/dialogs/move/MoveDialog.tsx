import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useState, type ReactElement} from 'react';
import {useTaskProgress} from '../../../hooks/useTaskProgress';
import {
    $moveDialog,
    $moveTaskId,
    cancelMoveDialog,
    executeMoveDialogAction,
} from '../../../store/dialogs/moveDialog.store';
import {resetSelection} from '../../../store/contentTreeSelection.store';
import {MoveDialogMainContent} from './MoveDialogMainContent';
import {MoveDialogProgressContent} from './MoveDialogProgressContent';

const MOVE_DIALOG_NAME = 'MoveDialog';
type View = 'main' | 'progress';

export const MoveDialog = (): ReactElement => {
    const {open, destinationPath} = useStore($moveDialog, {keys: ['open', 'destinationPath']});
    const taskId = useStore($moveTaskId);
    const {progress} = useTaskProgress(taskId);
    const [view, setView] = useState<View>('main');

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            cancelMoveDialog();
            setView('main');
        }
    };

    const handleMove = async () => {
        setView('progress');
        const started = await executeMoveDialogAction();
        if (started) {
            resetSelection();
            return;
        }
        setView('main');
    };

    useEffect(() => {
        if (!open) {
            setView('main');
        }
    }, [open]);

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                {view === 'main' && (
                    <MoveDialogMainContent onMove={() => void handleMove()} />
                )}
                {view === 'progress' && (
                    <MoveDialogProgressContent
                        destinationPath={destinationPath}
                        progress={progress}
                    />
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

MoveDialog.displayName = MOVE_DIALOG_NAME;
