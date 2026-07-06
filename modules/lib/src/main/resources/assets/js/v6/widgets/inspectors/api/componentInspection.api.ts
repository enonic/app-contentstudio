import { ResultAsync, errAsync } from 'neverthrow';
import type { ContentId } from '../../../../app/content/ContentId';
import { Descriptor } from '../../../../app/page/Descriptor';
import type { DescriptorJson } from '../../../../app/page/DescriptorJson';
import { ComponentType } from '../../../../app/page/region/ComponentType';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsProjectUrl, getCmsRestUri } from '../../../shared/lib/url/cms';

/**
 * Load component descriptors available for a given content, filtered by component type.
 * For parts: `.../schema/filter/parts`, for layouts: `.../schema/filter/layouts`.
 * Used by: widgets/inspectors/model/component-inspection.store.
 */
export function loadComponentDescriptors(
    componentType: string,
    contentId: ContentId,
): ResultAsync<Descriptor[], AppError> {
    const params = new URLSearchParams({ contentId: contentId.toString() });
    const url = `${getCmsProjectUrl(`content/schema/filter/${componentType}s`)}?${params}`;

    return requestJson<{ descriptors?: DescriptorJson[] }>(url).map((json) =>
        (json.descriptors ?? []).map((d) =>
            Descriptor.fromJson(d).setComponentType(ComponentType.byShortName(componentType)),
        ),
    );
}

// Cache for component descriptors (same pattern as pageInspection.api.ts)
const descriptorCache = new Map<string, ResultAsync<Descriptor, AppError>>();

/**
 * Load a single component descriptor by key and type.
 * Results are cached by `componentType::descriptorKey`.
 * Used by: widgets/inspectors/model/component-inspection.store.
 */
export function loadComponentDescriptor(
    componentType: string,
    descriptorKey: string,
): ResultAsync<Descriptor, AppError> {
    const cacheKey = `${componentType}::${descriptorKey}`;
    const cached = descriptorCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const url = `${getCmsRestUri(`content/page/${componentType}/descriptor`)}?key=${encodeURIComponent(descriptorKey)}`;

    const request = requestJson<DescriptorJson>(url)
        .map((json) => Descriptor.fromJson(json).setComponentType(ComponentType.byShortName(componentType)))
        .orElse((error) => {
            descriptorCache.delete(cacheKey);
            return errAsync(error);
        });

    descriptorCache.set(cacheKey, request);
    return request;
}
