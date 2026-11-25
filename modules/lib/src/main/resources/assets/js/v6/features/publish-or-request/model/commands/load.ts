// Commands that load the dependencies of the items listed in the publish or request dialog.
// The server resolves the ids; their summaries are then loaded a window at a time.

import type { ContentId } from '../../../../../app/content/ContentId';
import {
    createDependantWindowLoader,
    DEPENDANT_LOAD_SIZE,
    fetchDependantWindowSlice,
    orderSummariesByIds,
} from '../../../../entities/content/lib/dependantWindow';
import { resolveAppliedPublishDependencies } from '../../../../entities/content/lib/publishDependencies';
import { pruneExcludedDependantIds } from '../../../../shared/lib/cms/content/dependantsSelection';
import { hasContentIdInIds } from '../../../../shared/lib/cms/content/ids';
import { $publishOrRequestDialog, type PublishOrRequestDialogStore } from '../publishOrRequestDialog.store';

/**
 * Resolves the dependencies of the items with the applied selection and loads their first window.
 * The list shown stays in place until the answer arrives.
 */
export async function loadPublishOrRequestDialogData(): Promise<void> {
    const currentRun = ++runId;
    const { items, excludeChildrenIds, appliedExcludedDependantIds } = $publishOrRequestDialog.get();
    const ids = items.map((item) => item.getContentId());

    if (ids.length === 0) return;

    patchDialog({ loading: true, failed: false });

    const resolved = await resolveAppliedPublishDependencies({
        ids,
        excludeChildrenIds,
        excludedIds: appliedExcludedDependantIds,
    });
    if (currentRun !== runId) return;
    if (resolved.isErr()) return markLoadFailed();

    // `maxResult` has every dependency; `minResult` is the answer for the applied selection.
    const { maxResult, minResult } = resolved.value;
    const hiddenIds = findUnreachedIds(
        maxResult.getDependants(),
        minResult.getDependants(),
        appliedExcludedDependantIds,
    );
    const dependantIds = maxResult.getDependants().filter((id) => !hasContentIdInIds(id, hiddenIds));
    const requiredDependantIds = minResult.getRequired();
    const invalidIds = minResult.getInvalid();

    const { summaries, failed } = await fetchDependantWindowSlice(dependantIds, 0);
    if (currentRun !== runId) return;
    if (failed) return markLoadFailed();

    patchDialog({
        loading: false,
        dependants: orderSummariesByIds(summaries, dependantIds),
        dependantIds,
        dependantWindow: Math.min(DEPENDANT_LOAD_SIZE, dependantIds.length),
        requiredDependantIds,
        invalidIds,
        inProgressIds: minResult.getInProgress().filter((id) => !hasContentIdInIds(id, invalidIds)),
        notPublishableIds: minResult.getNotPublishable(),
        publishableIds: maxResult.getPublishable().filter((id) => !hasContentIdInIds(id, hiddenIds)),
        ...pruneExclusions(dependantIds, requiredDependantIds),
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

type Exclusions = Pick<PublishOrRequestDialogStore, 'excludedDependantIds' | 'appliedExcludedDependantIds'>;

// Number of the latest load. An answer that belongs to an older number is dropped.
let runId = 0;

function patchDialog(patch: Partial<PublishOrRequestDialogStore>): void {
    $publishOrRequestDialog.set({ ...$publishOrRequestDialog.get(), ...patch });
}

function markLoadFailed(): void {
    patchDialog({ loading: false, failed: true });
}

// Dependencies the server no longer reaches and the user did not untick: they were only needed
// by something that is unticked now, so they are neither listed nor published.
function findUnreachedIds(allIds: ContentId[], reachedIds: ContentId[], excludedIds: ContentId[]): ContentId[] {
    return allIds.filter((id) => !hasContentIdInIds(id, reachedIds) && !hasContentIdInIds(id, excludedIds));
}

// Drops the exclusions of dependencies that are gone from the list or have become required.
function pruneExclusions(dependantIds: ContentId[], requiredIds: ContentId[]): Exclusions {
    const { excludedDependantIds, appliedExcludedDependantIds } = $publishOrRequestDialog.get();

    return {
        excludedDependantIds: pruneExcludedDependantIds(excludedDependantIds, dependantIds, requiredIds),
        appliedExcludedDependantIds: pruneExcludedDependantIds(appliedExcludedDependantIds, dependantIds, requiredIds),
    };
}
