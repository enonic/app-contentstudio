import { showError } from '@enonic/lib-admin-ui/notify/MessageBus';
import type { ContentServerChangeItem } from '../../../../app/event/ContentServerChangeItem';
import { listContentIdsByParent } from '../../../entities/content/api/contentQuery.api';
import { $contentArchived, $contentDeleted, type ContentEvent } from '../../../shared/socket/socket.store';
import {
    $sortDialog,
    dropSortDialogItems,
    ensureSortDialogBatchLoaded,
    loadingBatches,
    toChildOrder,
} from './sortDialog.store';

//
// * Sort Dialog Service
//
// Reloads the sort dialog child ids when it opens or the sort order changes,
// and drops items removed on the server while the dialog is open.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

//
// * Data Loading
//

async function reloadSortDialogIds(): Promise<void> {
    // Bump the shared instance up front so older reloads and batch loads go stale.
    const callId = $sortDialog.get().instance + 1;
    $sortDialog.setKey('instance', callId);
    const { open, parent, selectedOptionId } = $sortDialog.get();
    if (!open || !parent) {
        return;
    }

    loadingBatches.clear();
    $sortDialog.set({
        ...$sortDialog.get(),
        idsLoading: true,
        idsFailed: false,
        failedBatches: [],
    });

    const order = toChildOrder(selectedOptionId);
    const result = await listContentIdsByParent({ parentId: parent.getContentId(), childOrder: order });
    if (callId !== $sortDialog.get().instance) {
        return;
    }

    if (result.isErr()) {
        $sortDialog.setKey('idsFailed', true);
        $sortDialog.setKey('idsLoading', false);
        showError(result.error.message);
        return;
    }

    const ids = result.value;
    $sortDialog.set({
        ...$sortDialog.get(),
        itemIds: ids.map((id) => id.toString()),
        idsLoading: false,
        idsFailed: false,
    });

    void ensureSortDialogBatchLoaded(0);
}

//
// * Event Handling
//

// Drop items removed on the server while the dialog is open, regardless of
// scroll position — a loaded row would otherwise revert to a stuck skeleton.
const dropDeletedSortDialogItems = (event: ContentEvent<ContentServerChangeItem[]> | null): void => {
    if (!event?.data || !$sortDialog.get().open) {
        return;
    }
    dropSortDialogItems(event.data.map((item) => item.getContentId().toString()));
};

//
// * Service Lifecycle
//

/**
 * Start the sort dialog wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        // Reload ids when the dialog opens or a non-manual sort order is selected
        $sortDialog.subscribe((state, previous) => {
            if (!state.open) {
                return;
            }

            const openedNow = !previous?.open;
            const sortChanged = state.selectedOptionId !== previous?.selectedOptionId;

            const shouldReload = openedNow || (sortChanged && state.selectedOptionId !== 'manual');
            if (shouldReload) {
                void reloadSortDialogIds();
            }
        }),
        $contentDeleted.subscribe(dropDeletedSortDialogItems),
        $contentArchived.subscribe(dropDeletedSortDialogItems),
    ];
};

/**
 * Stop the sort dialog wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
