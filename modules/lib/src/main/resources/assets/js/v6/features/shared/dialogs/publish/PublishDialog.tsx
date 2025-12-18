import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useState, type ReactElement} from 'react';
import {useTaskProgress} from '../../../hooks/useTaskProgress';
import {
    $publishDialog,
    $publishTaskId,
    $totalPublishableItems,
    publishItems,
    resetPublishDialogContext
} from '../../../store/dialogs/publishDialog.store';
import {PublishDialogMainContent} from './PublishDialogMainContent';
import {PublishDialogProgressContent} from './PublishDialogProgressContent';

type View = 'main' | 'progress';

const PUBLISH_DIALOG_NAME = 'PublishDialog';

export const PublishDialog = (): ReactElement => {
    const {open, items} = useStore($publishDialog, {keys: ['open', 'items']});
    const publishCount = useStore($totalPublishableItems);
    const taskId = useStore($publishTaskId);
    const {progress} = useTaskProgress(taskId);

    const [view, setView] = useState<View>('main');

    const progressTotal = Math.max(1, publishCount || items.length || 1);

    const resetView = () => setView('main');

    useEffect(() => {
        if (!open) {
            resetView();
        }
    }, [open]);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetPublishDialogContext();
            resetView();
        }
    };

    const handlePublish = async () => {
        setView('progress');
        const started = await publishItems();
        if (!started) {
            setView('main');
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                {view === 'main' && (
                    <PublishDialogMainContent onPublish={() => void handlePublish()} />
                )}
                {view === 'progress' && (
                    <PublishDialogProgressContent total={progressTotal} progress={progress} />
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

PublishDialog.displayName = PUBLISH_DIALOG_NAME;
