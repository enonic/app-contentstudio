// Commands that change which of the listed dependencies are included.
// A change is only staged on screen; the server takes it into account once it is applied.

import type { ContentId } from '../../../../../app/content/ContentId';
import { nextDependantExclusions } from '../../../../shared/lib/cms/content/dependantsSelection';
import { withIdExcluded } from '../../../../shared/lib/cms/content/draftSelection';
import { hasContentIdInIds } from '../../../../shared/lib/cms/content/ids';
import {
    $isPublishOrRequestSelectionSynced,
    $publishOrRequestDependantsSelection,
    $publishOrRequestDialog,
} from '../publishOrRequestDialog.store';
import { loadPublishOrRequestDialogData } from './load';

/** Includes or excludes one dependency. A required one always stays included. */
export function setPublishOrRequestDependantIncluded(id: ContentId, included: boolean): void {
    const { excludedDependantIds, requiredDependantIds } = $publishOrRequestDialog.get();
    if (hasContentIdInIds(id, requiredDependantIds)) return;

    const next = withIdExcluded(excludedDependantIds, id, !included);
    if (next === excludedDependantIds) return;

    $publishOrRequestDialog.setKey('excludedDependantIds', next);
}

/** Excludes every dependency that is not required when all are included; otherwise includes them all. */
export function togglePublishOrRequestDependantsSelection(): void {
    const selection = $publishOrRequestDependantsSelection.get();
    if (selection.selectableIds.length === 0) return;

    const { excludedDependantIds } = $publishOrRequestDialog.get();

    $publishOrRequestDialog.setKey('excludedDependantIds', nextDependantExclusions(selection, excludedDependantIds));
}

/** Applies the staged selection and resolves the dependencies again with it. */
export function applyPublishOrRequestSelection(): void {
    if ($isPublishOrRequestSelectionSynced.get()) return;

    const { excludedDependantIds } = $publishOrRequestDialog.get();
    $publishOrRequestDialog.setKey('appliedExcludedDependantIds', excludedDependantIds);

    void loadPublishOrRequestDialogData();
}

/** Drops the staged selection and shows the applied one again. */
export function cancelPublishOrRequestSelection(): void {
    if ($isPublishOrRequestSelectionSynced.get()) return;

    const { appliedExcludedDependantIds } = $publishOrRequestDialog.get();
    $publishOrRequestDialog.setKey('excludedDependantIds', appliedExcludedDependantIds);
}
