import { type ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { type Content } from '../../../app/content/Content';
import { type ContentId } from '../../../app/content/ContentId';
import { type ContentJson } from '../../../app/content/ContentJson';
import { type PageTemplate } from '../../../app/content/PageTemplate';
import { type Site } from '../../../app/content/Site';
import { Descriptor } from '../../../app/page/Descriptor';
import { type DescriptorJson } from '../../../app/page/DescriptorJson';
import { parseContent } from '../../entities/content/lib/parseContent';
import { getCmsApiUrl, getCmsRestUri } from '../../shared/lib/url/cms';

export { parseContent };

/**
 * Load page template by content ID.
 */
export async function loadPageTemplate(contentId: ContentId): Promise<PageTemplate | undefined> {
    const url = `${getCmsApiUrl('page/template')}?key=${encodeURIComponent(contentId.toString())}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const json: ContentJson = await response.json();
        return parseContent(json) as PageTemplate;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

// Cache for component descriptors
const descriptorCache = new Map<string, Promise<Descriptor>>();

/**
 * Load component descriptor for content.
 * Results are cached by descriptor key.
 */
export async function loadComponentDescriptor(content: Content): Promise<Descriptor | undefined> {
    const descriptorKey = content.getPage().getController().toString();
    const cacheKey = `page::${descriptorKey}`;

    // Return cached promise if available
    if (descriptorCache.has(cacheKey)) {
        try {
            return await descriptorCache.get(cacheKey);
        } catch {
            // Cache entry failed, will retry below
            descriptorCache.delete(cacheKey);
        }
    }

    const url = `${getCmsRestUri('content/page/descriptor')}?key=${encodeURIComponent(descriptorKey)}`;

    const promise = (async (): Promise<Descriptor> => {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(response.statusText);
        }

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

/**
 * Load nearest site for content ID.
 */
export async function loadNearestSite(contentId: ContentId): Promise<Site | undefined> {
    const url = getCmsApiUrl('nearestSite');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contentId: contentId.toString() }),
        });

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        if (response.status === 204) {
            return undefined;
        }

        const json: ContentJson | null = await response.json();

        if (!json) {
            return undefined;
        }

        return parseContent(json) as Site;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

/**
 * Load default page template for site and content type.
 */
export async function loadDefaultPageTemplate(
    siteId: ContentId,
    contentType: ContentTypeName,
): Promise<PageTemplate | undefined> {
    const params = new URLSearchParams({
        siteId: siteId.toString(),
        contentTypeName: contentType.toString(),
    });
    const url = `${getCmsApiUrl('page/template/default')}?${params}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        if (response.status === 204) {
            return undefined;
        }

        const json: ContentJson | null = await response.json();

        if (!json) {
            return undefined;
        }

        return parseContent(json) as PageTemplate;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}
