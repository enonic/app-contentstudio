// Commands behind the buttons of the check warnings of the publish or request dialog.

import type { ContentId } from '../../../../../app/content/ContentId';
import { uniqueIds } from '../../../../shared/lib/cms/content/ids';
import { $isPublishOrRequestInProgressExcludable, $publishOrRequestDialog } from '../publishOrRequestDialog.store';
import { loadPublishOrRequestDialogData } from './load';

/** Unticks the dependencies that are in progress. Does nothing when some of them cannot be unticked. */
export function excludePublishOrRequestInProgress(): void {
    if (!$isPublishOrRequestInProgressExcludable.get()) return;

    excludeDependants($publishOrRequestDialog.get().inProgressIds);
}

// *
// * Internal
// *

// Unticks the given dependencies and applies it at once, with no apply step, then resolves again.
function excludeDependants(ids: ContentId[]): void {
    const state = $publishOrRequestDialog.get();

    $publishOrRequestDialog.set({
        ...state,
        excludedDependantIds: uniqueIds([...state.excludedDependantIds, ...ids]),
        appliedExcludedDependantIds: uniqueIds([...state.appliedExcludedDependantIds, ...ids]),
    });
    void loadPublishOrRequestDialogData();
}
