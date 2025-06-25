import {ContentId} from '../../../app/content/ContentId';
import {ContentDependencyJson} from '../../../app/resource/json/ContentDependencyJson';
import {ResolveDependenciesResult, ResolveDependenciesResultJson} from '../../../app/resource/ResolveDependenciesResult';
import {Branch} from '../../../app/versioning/Branch';
import {getCmsApiUrl} from '../utils/url/cms';

/**
 * Resolve dependencies for multiple content items.
 */
export async function resolveDependencies(
    contentIds: ContentId[],
    target: Branch = Branch.DRAFT
): Promise<ResolveDependenciesResult> {
    const url = getCmsApiUrl('getDependencies');

    const payload = {
        contentIds: contentIds.map(id => id.toString()),
        target: target.toString(),
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

    const json: ResolveDependenciesResultJson = await response.json();
    return ResolveDependenciesResult.fromJson(json);
}

/**
 * Resolve dependencies for a single content item.
 * Returns undefined on error instead of throwing.
 */
export async function resolveDependenciesForId(contentId: ContentId): Promise<ContentDependencyJson | undefined> {
    try {
        const results = await resolveDependencies([contentId]);
        const result = results.getDependencies()[0];
        return result?.getDependency();
    } catch (error) {
        console.error(error);
        return undefined;
    }
}
