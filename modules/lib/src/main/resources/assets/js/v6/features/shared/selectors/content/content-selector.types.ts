import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';

/**
 * Shared types for ContentSelector components.
 * These types are used across the combobox and selection subcomponents.
 */

/**
 * Filter options for content queries.
 */
export type ContentSelectorFilterOptions = {
    /** Content types to filter by (e.g., ['app:article', 'media:image']) */
    contentTypeNames?: string[];
    /** Allowed content paths for site restriction (e.g., ['${site}']) */
    allowedContentPaths?: string[];
    /** Context content for path matching in query expressions */
    contextContent?: ContentSummary;
    /** Application key for filtering */
    applicationKey?: ApplicationKey;
};

/**
 * Selection mode for the content selector.
 */
export type ContentSelectorMode = 'single' | 'multiple';
