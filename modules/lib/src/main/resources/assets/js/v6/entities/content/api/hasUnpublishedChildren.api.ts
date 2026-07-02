import { type ContentId } from '../../../../app/content/ContentId';
import { requestJson } from '../../../shared/api/client';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

type HasUnpublishedChildrenJson = {
    id: { id: string };
    hasChildren: boolean;
};

type HasUnpublishedChildrenListJson = {
    contents: HasUnpublishedChildrenJson[];
};

/**
 * Check if content items have unpublished children.
 * Returns a Map of content ID to hasUnpublishedChildren boolean.
 */
export async function hasUnpublishedChildren(contentIds: ContentId[]): Promise<Map<string, boolean>> {
    const url = getCmsApiUrl('hasUnpublishedChildren');

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
    };

    const result = await requestJson<HasUnpublishedChildrenListJson>(url, { method: 'POST', body: payload });
    if (result.isErr()) {
        throw result.error;
    }

    return new Map(result.value.contents.map((item) => [item.id.id, item.hasChildren]));
}

/**
 * Check if a single content item has unpublished children.
 * Returns undefined on error instead of throwing.
 */
export async function hasUnpublishedChildrenForId(contentId: ContentId): Promise<boolean | undefined> {
    try {
        const result = await hasUnpublishedChildren([contentId]);
        return result.get(contentId.toString());
    } catch (error) {
        console.error(error);
        return undefined;
    }
}
