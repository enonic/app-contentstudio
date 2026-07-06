import { type ResultAsync } from 'neverthrow';
import { type ContentId } from '../../../../app/content/ContentId';
import { ContentTypeSummary } from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import { type ContentTypeSummaryJson } from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryJson';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsProjectUrl, getCmsRestUri } from '../../../shared/lib/url/cms';

type ContentTypesResponse = {
    contentTypes: ContentTypeSummaryJson[];
};

/**
 * Fetch all content types via the non-project schema endpoint.
 * Used by: features/shared/form/input-types/content-type-filter/useContentTypeFilter.
 */
export function fetchAllContentTypes(): ResultAsync<ContentTypeSummary[], AppError> {
    return requestJson<ContentTypesResponse>(getCmsRestUri('schema/content/all')).map((response) =>
        response.contentTypes.map((json) => ContentTypeSummary.fromJson(json)),
    );
}

/**
 * Fetch the content types available for the given content (project-scoped).
 * Used by: features/shared/form/input-types/content-type-filter/useContentTypeFilter.
 */
export function fetchContentTypesByContent(contentId: ContentId): ResultAsync<ContentTypeSummary[], AppError> {
    const url = `${getCmsProjectUrl('content/schema/content/byContent')}?contentId=${encodeURIComponent(contentId.toString())}`;

    return requestJson<ContentTypesResponse>(url).map((response) =>
        response.contentTypes.map((json) => ContentTypeSummary.fromJson(json)),
    );
}
