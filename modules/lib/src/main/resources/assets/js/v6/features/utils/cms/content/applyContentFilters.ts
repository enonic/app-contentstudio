import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';

/**
 * Options for filtering content selector requests.
 * These options correspond to the filter methods available on ContentSelectorRequest
 * and its subclasses (ContentTreeSelectorQueryRequest, ContentSelectorQueryRequest).
 */
export type ContentFilterOptions = {
    /** Context content for path matching in query expressions */
    contextContent?: ContentSummary;
    /** Content types to filter by (e.g., ['app:article', 'media:image']) */
    contentTypeNames?: string[];
    /** Allowed content paths for site restriction (e.g., ['${site}']) */
    allowedContentPaths?: string[];
    /** Application key for filtering */
    applicationKey?: ApplicationKey;
};

/**
 * Interface for request objects that support content filtering.
 * Both ContentTreeSelectorQueryRequest and ContentSelectorQueryRequest implement these methods.
 */
type HasFilterMethods = {
    setContent: (content: ContentSummary) => void;
    setContentTypeNames: (names: string[]) => void;
    setAllowedContentPaths: (paths: string[]) => void;
    setApplicationKey: (key: ApplicationKey) => void;
};

/**
 * Applies content filter options to a request object.
 * Consolidates the common pattern of setting filter parameters on content selector requests.
 *
 * @param request - The request object to apply filters to
 * @param filters - The filter options to apply
 * @returns The same request object (for chaining)
 *
 * @example
 * ```typescript
 * const request = new ContentTreeSelectorQueryRequest();
 * applyContentFilters(request, {
 *     contextContent: myContent,
 *     contentTypeNames: ['portal:site', 'portal:page-template'],
 *     allowedContentPaths: ['${site}'],
 *     applicationKey: myAppKey,
 * });
 * ```
 */
export function applyContentFilters<T extends HasFilterMethods>(
    request: T,
    filters: ContentFilterOptions,
): T {
    const {contextContent, contentTypeNames, allowedContentPaths, applicationKey} = filters;

    if (contextContent) {
        request.setContent(contextContent);
    }

    if (contentTypeNames && contentTypeNames.length > 0) {
        request.setContentTypeNames(contentTypeNames);
    }

    if (allowedContentPaths && allowedContentPaths.length > 0) {
        request.setAllowedContentPaths(allowedContentPaths);
    }

    if (applicationKey) {
        request.setApplicationKey(applicationKey);
    }

    return request;
}
