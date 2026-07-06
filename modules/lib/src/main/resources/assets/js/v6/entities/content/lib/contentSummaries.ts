import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { resolveContentSummaries } from '../api/content.api';

/**
 * Convenience wrapper over `resolveContentSummaries` that swallows failures to an
 * empty array so callers can treat an error as "no summaries".
 * Used by: features/{publish,unpublish,request-publish,delete,duplicate,issues}
 * dialogs, entities/content/lib/dependantWindow.
 */
export function fetchContentSummaries(contentIds: ContentId[]): Promise<ContentSummary[]> {
    return resolveContentSummaries(contentIds).match(
        (summaries) => summaries,
        (error) => {
            console.error(error);
            return [];
        },
    );
}
