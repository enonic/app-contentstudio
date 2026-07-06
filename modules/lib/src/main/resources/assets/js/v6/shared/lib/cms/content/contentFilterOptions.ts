import type { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';

/**
 * Options for filtering content selector queries. These map to the payload
 * fields of the content selector and tree selector endpoints.
 */
export type ContentFilterOptions = {
    /** Context content; contributes the contentId of the selector query. */
    contextContent?: ContentSummary;
    /** Content types to filter by (e.g., ['app:article', 'media:image']). */
    contentTypeNames?: string[];
    /** Allowed content paths for site restriction (e.g., ['${site}']). */
    allowedContentPaths?: string[];
    /** Application key for filtering. */
    applicationKey?: ApplicationKey;
};
