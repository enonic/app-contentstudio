import {ResolveDependencyResult} from './ResolveDependencyResult';
import {ContentDependencyJson} from './json/ContentDependencyJson';
import {ContentId} from '../content/ContentId';

export interface ResolveDependenciesResultJson {
    dependencies: { key: string, value: ContentDependencyJson };
}

export class ResolveDependenciesResult {

    private dependencies: ResolveDependencyResult[] = [];

    public getDependencies(): ResolveDependencyResult[] {
        return this.dependencies;
    }

    public getIncomingDependenciesCount(): Object {
        const object = {};
        this.dependencies.forEach(dependencyResult => {
            const dependency = dependencyResult.getDependency();
            const contentId = dependencyResult.getContentId().toString();
            if (dependency.inbound && dependency.inbound.length > 0) {
                object[contentId] = dependency.inbound.reduce((sum, dep) => sum + dep.count, 0);
            }
        });

        return object;
    }

    public static fromJson(json: ResolveDependenciesResultJson): ResolveDependenciesResult {

        const result = new ResolveDependenciesResult();

        if (json) {

            for (let id in json.dependencies) {
                if (json.dependencies.hasOwnProperty(id)) {
                    result.getDependencies().push(new ResolveDependencyResult(new ContentId(id), json.dependencies[id]));
                }
            }
        }

        return result;
    }
}
