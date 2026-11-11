import { PreviewActionHelper } from '../../../../app/action/PreviewActionHelper';
import { CreateIssuePromptEvent } from '../../../../app/browse/CreateIssuePromptEvent';
import { RequestContentPublishPromptEvent } from '../../../../app/browse/RequestContentPublishPromptEvent';
import { SortContentEvent } from '../../../../app/browse/sort/SortContentEvent';
import { ToggleSearchPanelEvent } from '../../../../app/browse/ToggleSearchPanelEvent';
import { EditContentEvent } from '../../../../app/event/EditContentEvent';
import { getCurrentItems, getCurrentItemsAsCSCS } from '../../../entities/content';
import { markAsReady } from '../../../entities/content/api/publish.api';
import { openDeleteDialog } from '../../../features/delete/model/deleteDialog.store';
import { openDuplicateDialog } from '../../../features/duplicate/model/duplicateDialog.store';
import { openMoveDialog } from '../../../features/move/model/moveDialog.store';
import { openNewContentDialog } from '../../../features/new-content/model/newContentDialog.store';
import { openPublishDialog } from '../../../features/publish/model/publishDialog.commands';
import { openUnpublishDialog } from '../../../features/unpublish/model/unpublishDialog.store';
import { i18n } from '../../../shared/i18n';
import { handleError, notifySuccess, notifyWarning } from '../../../shared/notifications';
import { DialogPresetConfirmElement } from '../../../shared/ui/dialogs/DialogPreset';
import { $activeWidget } from '../../../widgets/inspectors/model/liveViewWidgets.store';
import { getResolvedPreviewExtension } from '../../../widgets/preview-panel/model/previewResolution.store';
import { $browseActions, type BrowseActionId, canBeMarkedAsReady } from './browseActions.store';

// ! Kept apart from the store: the preview widgets store loads its data on import,
// ! so nothing that starts with the application may import this file.

const MAX_ITEMS_TO_EDIT = 50;
const MAX_ITEMS_TO_PREVIEW = 10;

let previewHelper: PreviewActionHelper | undefined;

function editCurrentItems(): void {
    const contents = [...getCurrentItemsAsCSCS()];

    if (contents.length > MAX_ITEMS_TO_EDIT) {
        notifyWarning(i18n('notify.edit.tooMuch'));
    } else if (contents.length > 0) {
        new EditContentEvent(contents).fire();
    }
}

function previewCurrentItems(): void {
    const items = [...getCurrentItems()];

    if (items.length >= MAX_ITEMS_TO_PREVIEW) {
        notifyWarning(i18n('notify.preview.tooMuch', MAX_ITEMS_TO_PREVIEW));
        return;
    }

    previewHelper ??= new PreviewActionHelper();
    previewHelper.openWindows(items, getResolvedPreviewExtension() ?? $activeWidget.get());
}

function markCurrentItemsAsReady(): void {
    const items = [...getCurrentItems()];
    const itemsToMark = items.filter(canBeMarkedAsReady);
    const canPublish = $browseActions.get().publish.enabled;

    const run = (): void => {
        void markAsReady(itemsToMark.map((item) => item.getContentId())).match(() => {
            if (itemsToMark.length === 1) {
                notifySuccess(i18n('notify.item.markedAsReady', itemsToMark[0].getName().toString()));
            } else {
                notifySuccess(i18n('notify.item.markedAsReady.multiple', itemsToMark.length));
            }

            if (canPublish) {
                openPublishDialog(items);
            }
        }, handleError);
    };

    if (itemsToMark.length === 1) {
        run();
        return;
    }

    const dialog = new DialogPresetConfirmElement({
        open: true,
        title: i18n('dialog.markAsReady.title'),
        description: i18n('dialog.markAsReady.question'),
        onConfirm: () => {
            dialog.close();
            run();
        },
        onCancel: () => dialog.close(),
    });
    dialog.open();
}

const COMMANDS: Record<BrowseActionId, () => void> = {
    new: () => openNewContentDialog(getCurrentItems()[0]),
    edit: editCurrentItems,
    archive: () => openDeleteDialog([...getCurrentItems()]),
    duplicate: () => openDuplicateDialog([...getCurrentItems()]),
    move: () => openMoveDialog([...getCurrentItems()]),
    sort: () => new SortContentEvent([...getCurrentItemsAsCSCS()]).fire(),
    preview: previewCurrentItems,
    publish: () => openPublishDialog([...getCurrentItems()], false),
    publishTree: () => openPublishDialog([...getCurrentItems()], true),
    unpublish: () => openUnpublishDialog([...getCurrentItems()]),
    markAsReady: markCurrentItemsAsReady,
    requestPublish: () => new RequestContentPublishPromptEvent([...getCurrentItemsAsCSCS()]).fire(),
    createIssue: () => new CreateIssuePromptEvent([...getCurrentItemsAsCSCS()]).fire(),
    search: () => new ToggleSearchPanelEvent().fire(),
};

/** Runs the action only while the store reports it enabled. */
export function executeBrowseAction(id: BrowseActionId): void {
    if (!$browseActions.get()[id].enabled) return;

    COMMANDS[id]();
}
