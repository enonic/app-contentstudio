import {ContentId} from '../../../app/content/ContentId';
import {getCmsApiUrl} from '../utils/url/cms';

type HasUnpublishedChildrenJson = {
    id: {id: string};
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
        contentIds: contentIds.map(id => id.toString()),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    const json: HasUnpublishedChildrenListJson = await response.json();

    return new Map(json.contents.map(item => [item.id.id, item.hasChildren]));
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
