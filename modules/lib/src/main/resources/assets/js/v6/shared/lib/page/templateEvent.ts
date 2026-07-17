import type { ContentPath } from '../../../../app/content/ContentPath';
import type { ContentSummary } from '../../../../app/content/ContentSummary';

const TEMPLATES_FOLDER_NAME = '_templates';

function isSameRoot(pathA: ContentPath | null, pathB: ContentPath | null): boolean {
    if (!pathA || !pathB) return false;

    return pathA.getRootElement() === pathB.getRootElement();
}

/**
 * Checks whether a created/updated content is a page template that may affect
 * how the given content is rendered. Cheap heuristic: any template under the
 * same path root qualifies, since summaries carry no page/template info.
 */
export function isTemplateEventForContent(eventSummary: ContentSummary, content: ContentSummary): boolean {
    return eventSummary.isPageTemplate() && isSameRoot(eventSummary.getPath(), content.getPath());
}

/**
 * Checks whether a deleted item may have been a page template affecting the
 * given content. Delete events carry no content type, so the `_templates`
 * folder segment in the path is used to detect templates.
 */
export function isDeletedTemplateForContent(deletedPath: ContentPath | null, content: ContentSummary): boolean {
    if (!deletedPath) return false;

    return deletedPath.getElements().includes(TEMPLATES_FOLDER_NAME) && isSameRoot(deletedPath, content.getPath());
}
