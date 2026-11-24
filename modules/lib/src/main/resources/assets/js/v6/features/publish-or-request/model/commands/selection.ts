// Commands that change which of the listed dependencies are included.

import type { ContentId } from '../../../../../app/content/ContentId';
import { withIdExcluded } from '../../../../shared/lib/cms/content/draftSelection';
import { $publishOrRequestDialog } from '../publishOrRequestDialog.store';

/** Includes or excludes one dependency. */
export function setPublishOrRequestDependantIncluded(id: ContentId, included: boolean): void {
    const { excludedDependantIds } = $publishOrRequestDialog.get();
    const next = withIdExcluded(excludedDependantIds, id, !included);
    if (next === excludedDependantIds) return;

    $publishOrRequestDialog.setKey('excludedDependantIds', next);
}
