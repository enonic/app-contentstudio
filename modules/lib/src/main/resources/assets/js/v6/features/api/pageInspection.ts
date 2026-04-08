import type {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import type {ContentId} from '../../../app/content/ContentId';
import type {ContentJson} from '../../../app/content/ContentJson';
import {type PageTemplate, PageTemplateBuilder} from '../../../app/content/PageTemplate';
import {Descriptor} from '../../../app/page/Descriptor';
import type {DescriptorJson} from '../../../app/page/DescriptorJson';
import {$projects} from '../store/projects.store';
import {getCmsApiUrl, getCmsRestUri} from '../utils/url/cms';

/**
 * Load page templates that can render the given content type within a site.
 */
export async function loadPageTemplatesByCanRender(
    siteId: ContentId,
    contentTypeName: ContentTypeName,
): Promise<PageTemplate[]> {
    const params = new URLSearchParams({
        siteId: siteId.toString(),
        contentTypeName: contentTypeName.toString(),
    });
    const url = `${getCmsApiUrl('page/template/listByCanRender')}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(response.statusText);

        const json = await response.json();
        const contents: ContentJson[] = json.contents ?? [];
        return contents.map(c => new PageTemplateBuilder().fromContentJson(c).build());
    } catch (error) {
        console.error(error);
        return [];
    }
}

/**
 * Load page controller descriptors available for a given content.
 */
export async function loadPageControllers(contentId: ContentId): Promise<Descriptor[]> {
    const project = $projects.get().activeProjectId ?? '';
    const params = new URLSearchParams({contentId: contentId.toString()});
    const url = `${getCmsRestUri(`cms/${project}/content/schema/filter/pages`)}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(response.statusText);

        const json = await response.json();
        const descriptors: DescriptorJson[] = json.descriptors ?? [];
        return descriptors.map(d => Descriptor.fromJson(d));
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Cache for page descriptors (same pattern as details.ts)
const descriptorCache = new Map<string, Promise<Descriptor>>();

/**
 * Load a single page descriptor by key.
 * Results are cached by descriptor key.
 */
export async function loadPageDescriptor(descriptorKey: string): Promise<Descriptor | undefined> {
    const cacheKey = `page::${descriptorKey}`;

    if (descriptorCache.has(cacheKey)) {
        try {
            return await descriptorCache.get(cacheKey);
        } catch {
            descriptorCache.delete(cacheKey);
        }
    }

    const url = `${getCmsRestUri('content/page/descriptor')}?key=${encodeURIComponent(descriptorKey)}`;

    const promise = (async (): Promise<Descriptor> => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(response.statusText);

        const json: DescriptorJson = await response.json();
        return Descriptor.fromJson(json);
    })();

    descriptorCache.set(cacheKey, promise);

    try {
        return await promise;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}
