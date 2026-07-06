import { type ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { ResultAsync, errAsync } from 'neverthrow';
import { type Content } from '../../../../app/content/Content';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { type PageTemplate } from '../../../../app/content/PageTemplate';
import { type Site } from '../../../../app/content/Site';
import { Descriptor } from '../../../../app/page/Descriptor';
import { type DescriptorJson } from '../../../../app/page/DescriptorJson';
import { requestJson, requestOptionalJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl, getCmsRestUri } from '../../../shared/lib/url/cms';
import { parseContent } from '../../../entities/content/lib/parseContent';

export { parseContent };

/**
 * Load page template by content ID.
 * Used by: widgets/context-panel/widget/details/DetailsWidgetTemplateSection.
 */
export function loadPageTemplate(contentId: ContentId): ResultAsync<PageTemplate, AppError> {
    const url = `${getCmsApiUrl('page/template')}?key=${encodeURIComponent(contentId.toString())}`;

    return requestJson<ContentJson>(url).map((json) => parseContent(json) as PageTemplate);
}

// Cache for component descriptors
const descriptorCache = new Map<string, ResultAsync<Descriptor, AppError>>();

function fetchComponentDescriptor(cacheKey: string, descriptorKey: string): ResultAsync<Descriptor, AppError> {
    const url = `${getCmsRestUri('content/page/descriptor')}?key=${encodeURIComponent(descriptorKey)}`;

    const request = requestJson<DescriptorJson>(url)
        .map((json) => Descriptor.fromJson(json))
        .orElse((error) => {
            descriptorCache.delete(cacheKey);
            return errAsync(error);
        });

    descriptorCache.set(cacheKey, request);
    return request;
}

/**
 * Load component descriptor for content.
 * Results are cached by descriptor key. A failed cached request is retried
 * once within the same call, so concurrent callers sharing a transiently
 * failed fetch recover instead of all resolving to the same error.
 * Used by: widgets/context-panel/widget/details/DetailsWidgetTemplateSection.
 */
export function loadComponentDescriptor(content: Content): ResultAsync<Descriptor, AppError> {
    const descriptorKey = content.getPage().getController().toString();
    const cacheKey = `page::${descriptorKey}`;

    const cached = descriptorCache.get(cacheKey);
    if (cached) {
        return cached.orElse(() => fetchComponentDescriptor(cacheKey, descriptorKey));
    }

    return fetchComponentDescriptor(cacheKey, descriptorKey);
}

/**
 * Load nearest site for content ID.
 * Used by: features/shared/hooks/useApplicationKeys,
 * widgets/context-panel/widget/details/DetailsWidgetTemplateSection.
 */
export function loadNearestSite(contentId: ContentId): ResultAsync<Site | undefined, AppError> {
    const url = getCmsApiUrl('nearestSite');

    return requestOptionalJson<ContentJson>(url, {
        method: 'POST',
        body: { contentId: contentId.toString() },
    }).map((json) => (json ? (parseContent(json) as Site) : undefined));
}

/**
 * Load default page template for site and content type.
 * Used by: widgets/context-panel/widget/details/DetailsWidgetTemplateSection.
 */
export function loadDefaultPageTemplate(
    siteId: ContentId,
    contentType: ContentTypeName,
): ResultAsync<PageTemplate | undefined, AppError> {
    const params = new URLSearchParams({
        siteId: siteId.toString(),
        contentTypeName: contentType.toString(),
    });
    const url = `${getCmsApiUrl('page/template/default')}?${params}`;

    return requestOptionalJson<ContentJson>(url).map((json) =>
        json ? (parseContent(json) as PageTemplate) : undefined,
    );
}
