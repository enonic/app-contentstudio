import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { Button, Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { ResultAsync, okAsync } from 'neverthrow';
import { useEffect, useState, type ReactElement } from 'react';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { useTaskProgress } from '../../../entities/task/useTaskProgress';
import {
    $moveItems,
    $moveDialog,
    $moveTaskId,
    cancelMoveDialog,
    executeMoveDialogAction,
} from '../model/moveDialog.store';
import { clearSelection, fetchNearestSite, setActive } from '../../../entities/content';
import { type AppError } from '../../../shared/api/errors';
import { MoveDialogMainContent } from './MoveDialogMainContent';
import { MoveDialogProgressContent } from './MoveDialogProgressContent';

const MOVE_DIALOG_NAME = 'MoveDialog';
type View = 'main' | 'confirmation' | 'progress';

export const MoveDialog = (): ReactElement => {
    const { open, destinationPath, destinationItem } = useStore($moveDialog, {
        keys: ['open', 'destinationPath', 'destinationItem'],
    });
    const taskId = useStore($moveTaskId);
    const items = useStore($moveItems);
    const { progress } = useTaskProgress(taskId);
    const [view, setView] = useState<View>('main');

    const confirmTitle = useI18n('dialog.confirm.title');
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
            setActive(null);
            clearSelection();
            return;
        }
        resetView();
    };

    const handleMove = async () => {
        const result = await checkContentWillMoveOutOfSite();
        if (result.isErr()) {
            DefaultErrorHandler.handle(result.error);
            return;
        }

        if (result.value) {
            setView('confirmation');
            return;
        }

        await startMove();
    };

    const checkContentWillMoveOutOfSite = (): ResultAsync<boolean, AppError> => {
        if (!destinationItem) {
            return okAsync(false);
        }

        const targetSiteResult: ResultAsync<ContentSummary | undefined, AppError> = destinationItem.isSite()
            ? okAsync(destinationItem)
            : fetchNearestSite(destinationItem.getContentId());

        const parentSiteResults: ResultAsync<ContentSummary | undefined, AppError>[] = items.map((item) =>
            item.isSite() ? okAsync(undefined) : fetchNearestSite(item.getContentId()),
        );

        return ResultAsync.combine([targetSiteResult, ...parentSiteResults]).map(([targetSite, ...parentSites]) => {
            const targetSiteId = targetSite?.getId() ?? null;
            return parentSites.filter((site) => site != null).some((site) => site.getId() !== targetSiteId);
        });
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
                {view === 'main' && <MoveDialogMainContent onMove={() => void handleMove()} />}
                {view === 'confirmation' && (
                    <Dialog.Content className="max-w-180 w-fit sm:min-w-152 text-main gap-2.5">
                        <Dialog.DefaultHeader title={confirmTitle} description={confirmDescription} withClose />
                        <Dialog.Footer>
                            <Button size="lg" label={cancelLabel} variant="outline" onClick={resetView} />
                            <Button
                                size="lg"
                                label={confirmLabel}
                                variant="solid"
                                className="bg-btn-error text-alt hover:bg-btn-error-hover active:bg-btn-error-active focus-visible:ring-error/50"
                                onClick={() => void startMove()}
                            />
                        </Dialog.Footer>
                    </Dialog.Content>
                )}
                {view === 'progress' && (
                    <MoveDialogProgressContent destinationPath={destinationPath ?? undefined} progress={progress} />
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

MoveDialog.displayName = MOVE_DIALOG_NAME;
