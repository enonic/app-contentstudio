import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentDependencyJson } from '../../../../app/resource/json/ContentDependencyJson';
import {
    ResolveDependenciesResult,
    type ResolveDependenciesResultJson,
} from '../../../../app/resource/ResolveDependenciesResult';
import { Branch } from '../../../../app/versioning/Branch';
import { requestJson } from '../../../shared/api/client';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Resolve dependencies for multiple content items.
 */
export async function resolveDependencies(
    contentIds: ContentId[],
    target: Branch = Branch.DRAFT,
): Promise<ResolveDependenciesResult> {
    const url = getCmsApiUrl('getDependencies');

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
        target: target.toString(),
    };

    const result = await requestJson<ResolveDependenciesResultJson>(url, { method: 'POST', body: payload });
    if (result.isErr()) {
        throw result.error;
    }

    return ResolveDependenciesResult.fromJson(result.value);
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
