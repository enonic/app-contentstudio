import {Button, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useState, type ReactElement} from 'react';
import {GetNearestSiteRequest} from '../../../../../app/resource/GetNearestSiteRequest';
import {useI18n} from '../../../hooks/useI18n';
import {useTaskProgress} from '../../../hooks/useTaskProgress';
import {
    $moveCurrentItems,
    $moveDialog,
    $moveTaskId,
    cancelMoveDialog,
    executeMoveDialogAction,
} from '../../../store/dialogs/moveDialog.store';
import {resetSelection} from '../../../store/contentTreeSelection.store';
import {MoveDialogMainContent} from './MoveDialogMainContent';
import {MoveDialogProgressContent} from './MoveDialogProgressContent';

const MOVE_DIALOG_NAME = 'MoveDialog';
type View = 'main' | 'confirmation' | 'progress';

export const MoveDialog = (): ReactElement => {
    const {open, destinationPath, destinationItem} = useStore($moveDialog, {keys: ['open', 'destinationPath', 'destinationItem']});
    const taskId = useStore($moveTaskId);
    const items = useStore($moveCurrentItems);
    const {progress} = useTaskProgress(taskId);
    const [view, setView] = useState<View>('main');

    const confirmTitle = useI18n('dialog.confirm.move.title');
    const confirmDescription = useI18n('dialog.confirm.move.description');
    const cancelLabel = useI18n('action.cancel');
    const confirmLabel = useI18n('action.confirm');

    const resetView = () => {
        setView('main');
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            cancelMoveDialog();
            resetView();
        }
    };

    const startMove = async () => {
        setView('progress');
        const started = await executeMoveDialogAction();
        if (started) {
            resetSelection();
            return;
        }
        resetView();
    };

    const handleMove = async () => {
        const willMoveOutOfSite = await checkContentWillMoveOutOfSite();
        if (willMoveOutOfSite) {
            setView('confirmation');
            return;
        }
        await startMove();
    };

    const checkContentWillMoveOutOfSite = async (): Promise<boolean> => {
        if (!destinationItem) {
            return false;
        }

        const targetContentId = destinationItem.getContentId();
        const targetSite = destinationItem.getContentSummary().isSite()
            ? destinationItem.getContentSummary()
            : await new GetNearestSiteRequest(targetContentId).sendAndParse();
        const targetSiteId = targetSite?.getId() ?? null;

        const parentSitePromises = items.map((item) => {
            if (item.getContentSummary().isSite()) {
                return Promise.resolve(null);
            }
            return new GetNearestSiteRequest(item.getContentId()).sendAndParse();
        });

        const parentSites = await Promise.all(parentSitePromises);

        return parentSites
            .filter((site) => site != null)
            .some((site) => site.getId() !== targetSiteId);
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
                {view === 'main' && (
                    <MoveDialogMainContent onMove={() => void handleMove()} />
                )}
                {view === 'confirmation' && (
                    <Dialog.Content className='max-w-180 w-fit sm:min-w-152 text-main gap-2.5'>
                        <Dialog.DefaultHeader title={confirmTitle} description={confirmDescription} withClose />
                        <Dialog.Footer>
                            <Button size='lg' label={cancelLabel} variant='outline' onClick={resetView} />
                            <Button
                                size='lg'
                                label={confirmLabel}
                                variant='solid'
                                className='bg-btn-error text-alt hover:bg-btn-error-hover active:bg-btn-error-active focus-visible:ring-error/50'
                                onClick={() => void startMove()}
                            />
                        </Dialog.Footer>
                    </Dialog.Content>
                )}
                {view === 'progress' && (
                    <MoveDialogProgressContent
                        destinationPath={destinationPath ?? undefined}
                        progress={progress}
                    />
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

MoveDialog.displayName = MOVE_DIALOG_NAME;
