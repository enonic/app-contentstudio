// Commands that change which of the listed dependencies are included.

import type { ContentId } from '../../../../../app/content/ContentId';
import { withIdExcluded } from '../../../../shared/lib/cms/content/draftSelection';
import { hasContentIdInIds } from '../../../../shared/lib/cms/content/ids';
import { $publishOrRequestDialog } from '../publishOrRequestDialog.store';

/** Includes or excludes one dependency. A required one always stays included. */
export function setPublishOrRequestDependantIncluded(id: ContentId, included: boolean): void {
    const { excludedDependantIds, requiredDependantIds } = $publishOrRequestDialog.get();
    if (hasContentIdInIds(id, requiredDependantIds)) return;

    const next = withIdExcluded(excludedDependantIds, id, !included);
    if (next === excludedDependantIds) return;

    $publishOrRequestDialog.setKey('excludedDependantIds', next);
}
