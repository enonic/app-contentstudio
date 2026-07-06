import { ResultAsync, errAsync } from 'neverthrow';
import type { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentJson } from '../../../../app/content/ContentJson';
import { type PageTemplate, PageTemplateBuilder } from '../../../../app/content/PageTemplate';
import { Descriptor } from '../../../../app/page/Descriptor';
import type { DescriptorJson } from '../../../../app/page/DescriptorJson';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl, getCmsProjectUrl, getCmsRestUri } from '../../../shared/lib/url/cms';

/**
 * Load page templates that can render the given content type within a site.
 * Used by: widgets/inspectors/model/page-inspection.store.
 */
export function loadPageTemplatesByCanRender(
    siteId: ContentId,
    contentTypeName: ContentTypeName,
): ResultAsync<PageTemplate[], AppError> {
    const params = new URLSearchParams({
        siteId: siteId.toString(),
        contentTypeName: contentTypeName.toString(),
    });
    const url = `${getCmsApiUrl('page/template/listByCanRender')}?${params}`;

    return requestJson<{ contents?: ContentJson[] }>(url).map((json) =>
        (json.contents ?? []).map((c) => new PageTemplateBuilder().fromContentJson(c).build()),
    );
}

/**
 * Load page controller descriptors available for a given content.
 * Used by: widgets/inspectors/model/page-inspection.store.
 */
export function loadPageControllers(contentId: ContentId): ResultAsync<Descriptor[], AppError> {
    const params = new URLSearchParams({ contentId: contentId.toString() });
    const url = `${getCmsProjectUrl('content/schema/filter/pages')}?${params}`;

    return requestJson<{ descriptors?: DescriptorJson[] }>(url).map((json) =>
        (json.descriptors ?? []).map((d) => Descriptor.fromJson(d)),
    );
}

// Cache for page descriptors (same pattern as details.api.ts)
const descriptorCache = new Map<string, ResultAsync<Descriptor, AppError>>();

/**
 * Load a single page descriptor by key.
 * Results are cached by descriptor key.
 * Used by: widgets/inspectors/model/page-inspection.store.
 */
export function loadPageDescriptor(descriptorKey: string): ResultAsync<Descriptor, AppError> {
    const cacheKey = `page::${descriptorKey}`;

    const cached = descriptorCache.get(cacheKey);
    if (cached) {
        return cached;
    }

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
