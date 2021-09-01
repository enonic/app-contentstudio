import {ContentId} from '../content/ContentId';
import {ResolveContentForDeleteJson} from './json/ResolveContentForDeleteJson';
import {InboundDependenciesJson} from './json/InboundDependenciesJson';
import {InboundDependenciesResult} from './InboudDependenciesResult';

export class ResolveContentForDeleteResult {

    private readonly contentIds: ContentId[];

    private readonly inboundDependencies: InboundDependenciesResult[];

    constructor(contentIds: ContentId[], inboundDependencies: InboundDependenciesResult[]) {

        this.contentIds = contentIds;
        this.inboundDependencies = inboundDependencies;
    }

    getContentIds(): ContentId[] {
        return this.contentIds;
    }

    getInboundDependencies(): InboundDependenciesResult[] {
        return this.inboundDependencies;
    }

    hasInboundDependencies() {
        return this.inboundDependencies.length > 0;
    }

    hasInboundDependency(id: string): boolean {
        return this.inboundDependencies.some((dep: InboundDependenciesResult) => dep.getId().toString() === id);
    }

    static fromJson(json: ResolveContentForDeleteJson): ResolveContentForDeleteResult {

        const contentIds: ContentId[] = json.contentIds
                                        ? json.contentIds.map(item => new ContentId(item.id))
                                        : [];
        const inboundDependencies: InboundDependenciesResult[] = json.inboundDependencies
                                                 ? json.inboundDependencies.map(item => InboundDependenciesResult.fromJson(item))
                                                 : [];


        return new ResolveContentForDeleteResult(contentIds, inboundDependencies);
    }
}
