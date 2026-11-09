import { type ResultAsync } from 'neverthrow';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ApplicationKey } from '../../../shared/lib/cms/application/applicationKey';
import { requestJson } from '@enonic/ui-utils/request';
import type { AppError } from '@enonic/ui-utils';
import { getCmsProjectUrl, getCmsRestUri } from '../../../shared/lib/url/cms';
import {
    type ContentTypeSummary,
    type ContentTypeSummaryJson,
    parseContentTypeSummary,
} from '../lib/contentTypeSummary';

type ContentTypesResponse = {
    contentTypes: ContentTypeSummaryJson[];
};

/**
 * Fetch all content types via the non-project schema endpoint.
 * Used by: features/shared/form/input-types/content-type-filter/useContentTypeFilter.
 */
export function fetchAllContentTypes(): ResultAsync<ContentTypeSummary[], AppError> {
    return requestJson<ContentTypesResponse>(getCmsRestUri('schema/content/all')).map((response) =>
        response.contentTypes.map(parseContentTypeSummary),
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

    return requestJson<ContentTypesResponse>(url).map((response) => response.contentTypes.map(parseContentTypeSummary));
}

export type CreatableContentTypesParams = {
    contentId?: ContentId;
    allowedContentTypes?: string[];
    /** Resolves `${app}` in the allowed patterns when there is no content; a content's own application does otherwise. */
    applicationKey?: ApplicationKey;
    projectName?: string;
};

/**
 * Fetch the content types that can be created under the given content, narrowed to the allowed ones (project-scoped).
 * Used by: features/new-content.
 */
export function fetchCreatableContentTypes({
    contentId,
    allowedContentTypes,
    applicationKey,
    projectName,
}: CreatableContentTypesParams): ResultAsync<ContentTypeSummary[], AppError> {
    return requestJson<ContentTypesResponse>(getCmsProjectUrl('content/schema/filter/contentTypes', projectName), {
        method: 'POST',
        body: { contentId: contentId?.toString(), allowedContentTypes, applicationKey },
    }).map((response) => response.contentTypes.map(parseContentTypeSummary));
}
