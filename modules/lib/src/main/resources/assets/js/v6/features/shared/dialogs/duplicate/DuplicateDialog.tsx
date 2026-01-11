import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useState, type ReactElement} from 'react';
import {useTaskProgress} from '../../../hooks/useTaskProgress';
import {
    $duplicateDialog,
    $duplicateItemsCount,
    $duplicateTaskId,
    cancelDuplicateDialog,
    executeDuplicateDialogAction
} from '../../../store/dialogs/duplicateDialog.store';
import {resetSelection} from '../../../store/contentTreeSelection.store';
import {DuplicateDialogMainContent} from './DuplicateDialogMainContent';
import {DuplicateDialogProgressContent} from './DuplicateDialogProgressContent';

type View = 'main' | 'progress';

const DUPLICATE_DIALOG_NAME = 'DuplicateDialog';

export const DuplicateDialog = (): ReactElement => {
    const {open, items} = useStore($duplicateDialog, {keys: ['open', 'items']});
    const total = useStore($duplicateItemsCount);
    const taskId = useStore($duplicateTaskId);
    const {progress} = useTaskProgress(taskId);

    const [view, setView] = useState<View>('main');

    const progressTotal = Math.max(1, total || items.length || 1);

    const resetView = () => setView('main');

    useEffect(() => {
        if (!open) {
            resetView();
        }
    }, [open]);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            cancelDuplicateDialog();
            resetView();
        }
    };

    const handleDuplicate = async () => {
        setView('progress');
        const started = await executeDuplicateDialogAction();
        if (started) {
            resetSelection();
            return;
        }
        setView('main');
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                {view === 'main' && (
                    <DuplicateDialogMainContent onDuplicate={() => void handleDuplicate()} />
                )}
                {view === 'progress' && (
                    <DuplicateDialogProgressContent total={progressTotal} progress={progress} />
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

DuplicateDialog.displayName = DUPLICATE_DIALOG_NAME;
