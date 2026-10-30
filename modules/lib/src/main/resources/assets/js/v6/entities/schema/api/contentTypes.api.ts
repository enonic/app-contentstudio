import { type ResultAsync } from 'neverthrow';
import { type ContentId } from '../../../../app/content/ContentId';
import { ContentTypeSummary } from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import { type ContentTypeSummaryJson } from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryJson';
import { requestJson } from '@enonic/ui-utils/request';
import type { AppError } from '@enonic/ui-utils';
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
export function fetchContentTypesByContent(
    contentId: ContentId,
    projectName?: string,
): ResultAsync<ContentTypeSummary[], AppError> {
    const url = `${getCmsProjectUrl('content/schema/content/byContent', projectName)}?contentId=${encodeURIComponent(contentId.toString())}`;

    return requestJson<ContentTypesResponse>(url).map((response) =>
        response.contentTypes.map((json) => ContentTypeSummary.fromJson(json)),
    );
}
