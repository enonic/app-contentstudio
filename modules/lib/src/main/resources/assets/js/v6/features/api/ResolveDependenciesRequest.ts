import {ContentId} from '../../../app/content/ContentId';
import {ResolveDependenciesResult, ResolveDependenciesResultJson} from '../../../app/resource/ResolveDependenciesResult';
import {UrlHelper} from '../../../app/util/UrlHelper';
import {Branch} from '../../../app/versioning/Branch';

export async function resolveDependencies(contentIds: ContentId[], target: Branch = Branch.DRAFT): Promise<ResolveDependenciesResult> {
    const url = UrlHelper.getCmsRestUri(UrlHelper.getCMSPathWithProject(undefined, 'content/getDependencies'));

    const payload = {
        contentIds: contentIds.map(id => id.toString()),
        target: target.toString(),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    const json: ResolveDependenciesResultJson = await response.json();
    return ResolveDependenciesResult.fromJson(json);
}

