import {ResolveDependencyResult} from './ResolveDependencyResult';
import {type ContentDependencyJson} from './json/ContentDependencyJson';
import {ContentId} from '../content/ContentId';

export interface ResolveDependenciesResultJson {
    dependencies: { key: string, value: ContentDependencyJson };
}

export class ResolveDependenciesResult {

    private readonly dependencies: ResolveDependencyResult[] = [];

    private readonly incomingDependenciesCount: Map<string, number> = new Map<string, number>();

    constructor(dependencies: ResolveDependencyResult[]) {
        this.dependencies = dependencies;

        this.dependencies.forEach(dependencyResult => {
            const dependency: ContentDependencyJson = dependencyResult.getDependency();
            const contentId: string = dependencyResult.getContentId().toString();

            if (dependency.inbound && dependency.inbound.length > 0) {
                this.incomingDependenciesCount.set(contentId, dependency.inbound.reduce((sum, dep) => sum + dep.count, 0));
            }
        });
    }

    public getDependencies(): ResolveDependencyResult[] {
        return this.dependencies;
    }

    public getIncomingDependenciesCount(): Map<string, number> {
        return this.incomingDependenciesCount;
    }

    public hasIncomingDependency(id: string): boolean {
        return this.incomingDependenciesCount.has(id);
    }

    public static fromJson(json: ResolveDependenciesResultJson): ResolveDependenciesResult {
        const dependencies: ResolveDependencyResult[] = [];

        if (json) {
            for (const id in json.dependencies) {
                if (json.dependencies.hasOwnProperty(id)) {
                    dependencies.push(new ResolveDependencyResult(new ContentId(id), json.dependencies[id]));
                }
            }
        }

        return new ResolveDependenciesResult(dependencies);
    }
}
