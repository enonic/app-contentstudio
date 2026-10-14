import type { PageEditorContentContext } from './types';

// A site rename changes its path, but not the content and site owning inspection data.
export function isSameInspectionOwner(
    previous: PageEditorContentContext | null,
    current: PageEditorContentContext | null,
): boolean {
    return (
        previous != null &&
        current != null &&
        previous.contentId.toString() === current.contentId.toString() &&
        previous.contentTypeName.toString() === current.contentTypeName.toString() &&
        previous.siteId?.toString() === current.siteId?.toString()
    );
}
