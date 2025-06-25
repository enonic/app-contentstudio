import {ContentId} from '../../../app/content/ContentId';
import {ContentDependencyJson} from '../../../app/resource/json/ContentDependencyJson';
import {ResolveDependenciesRequest} from '../../../app/resource/ResolveDependenciesRequest';

export async function resolveDependencies(contentId: ContentId): Promise<ContentDependencyJson | undefined> {
    try {
        const request = new ResolveDependenciesRequest([contentId]);

        const resolveDependenciesResult = await request.sendAndParse();

        const dependencyEntry = resolveDependenciesResult.getDependencies()[0];

        return dependencyEntry.getDependency();
    } catch (error) {
        console.error(error);

        return undefined;
    }
}
