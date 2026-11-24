// Commands that load the dependencies of the items listed in the publish or request dialog.
// The server resolves the ids; their summaries are then loaded a window at a time.

import { resolvePublishDependencies } from '../../../../entities/content/api/publish.api';
import {
    createDependantWindowLoader,
    DEPENDANT_LOAD_SIZE,
    fetchDependantWindowSlice,
    orderSummariesByIds,
} from '../../../../entities/content/lib/dependantWindow';
import { $publishOrRequestDialog, type PublishOrRequestDialogStore } from '../publishOrRequestDialog.store';

/** Resolves the dependencies of the opened-with items and loads their first window. */
export async function loadPublishOrRequestDialogData(): Promise<void> {
    const currentRun = ++runId;
    const ids = $publishOrRequestDialog.get().items.map((item) => item.getContentId());

    patchDialog({ loading: ids.length > 0, failed: false, dependants: [], dependantIds: [], dependantWindow: 0 });

    if (ids.length === 0) return;

    // Children are left out: `excludeChildrenIds` lists the items whose children are not wanted.
    const resolved = await resolvePublishDependencies({ ids, excludeChildrenIds: ids });
    if (currentRun !== runId) return;
    if (resolved.isErr()) return markLoadFailed();

    const dependantIds = resolved.value.getDependants();
    const { summaries, failed } = await fetchDependantWindowSlice(dependantIds, 0);
    if (currentRun !== runId) return;
    if (failed) return markLoadFailed();

    patchDialog({
        loading: false,
        dependants: orderSummariesByIds(summaries, dependantIds),
        dependantIds,
        dependantWindow: Math.min(DEPENDANT_LOAD_SIZE, dependantIds.length),
    });
}

/** Loads the next window of dependencies. Called when the list is scrolled to its end. */
export const loadMorePublishOrRequestDependants = createDependantWindowLoader($publishOrRequestDialog, () => runId);

/** Makes the answer of a load that is still running be ignored. */
export function cancelPublishOrRequestDialogLoad(): void {
    runId += 1;
}

// *
// * Internal
// *

// Number of the latest load. An answer that belongs to an older number is dropped.
let runId = 0;

function patchDialog(patch: Partial<PublishOrRequestDialogStore>): void {
    $publishOrRequestDialog.set({ ...$publishOrRequestDialog.get(), ...patch });
}

function markLoadFailed(): void {
    patchDialog({ loading: false, failed: true });
}
