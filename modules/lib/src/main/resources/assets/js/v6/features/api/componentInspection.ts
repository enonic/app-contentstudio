import type {ContentId} from '../../../app/content/ContentId';
import {Descriptor} from '../../../app/page/Descriptor';
import type {DescriptorJson} from '../../../app/page/DescriptorJson';
import {ComponentType} from '../../../app/page/region/ComponentType';
import {$projects} from '../store/projects.store';
import {getCmsRestUri} from '../utils/url/cms';

/**
 * Load component descriptors available for a given content, filtered by component type.
 * For parts: `.../schema/filter/parts`, for layouts: `.../schema/filter/layouts`.
 */
export async function loadComponentDescriptors(componentType: string, contentId: ContentId): Promise<Descriptor[]> {
    const project = $projects.get().activeProjectId ?? '';
    const params = new URLSearchParams({contentId: contentId.toString()});
    const url = `${getCmsRestUri(`cms/${project}/content/schema/filter/${componentType}s`)}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(response.statusText);

        const json = await response.json();
        const descriptors: DescriptorJson[] = json.descriptors ?? [];
        return descriptors.map(d => Descriptor.fromJson(d).setComponentType(ComponentType.byShortName(componentType)));
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Cache for component descriptors (same pattern as pageInspection.ts)
const descriptorCache = new Map<string, Promise<Descriptor>>();

/**
 * Load a single component descriptor by key and type.
 * Results are cached by `componentType::descriptorKey`.
 */
export async function loadComponentDescriptor(componentType: string, descriptorKey: string): Promise<Descriptor | undefined> {
    const cacheKey = `${componentType}::${descriptorKey}`;

    if (descriptorCache.has(cacheKey)) {
        try {
            return await descriptorCache.get(cacheKey);
        } catch {
            descriptorCache.delete(cacheKey);
        }
    }

    const url = `${getCmsRestUri(`content/page/${componentType}/descriptor`)}?key=${encodeURIComponent(descriptorKey)}`;

    const promise = (async (): Promise<Descriptor> => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(response.statusText);

        const json: DescriptorJson = await response.json();
        return Descriptor.fromJson(json).setComponentType(ComponentType.byShortName(componentType));
    })();

    descriptorCache.set(cacheKey, promise);

    try {
        return await promise;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}
