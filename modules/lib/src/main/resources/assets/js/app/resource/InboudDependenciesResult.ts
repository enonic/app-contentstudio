import {ContentId} from '../content/ContentId';
import {type InboundDependenciesJson} from './json/InboundDependenciesJson';

export class InboundDependenciesResult {
    private readonly id: ContentId;

    private readonly inboundDependencies: ContentId[];

    constructor(id: ContentId, inboundDependencies: ContentId[]) {

        this.id = id;
        this.inboundDependencies = inboundDependencies;
    }

    getId(): ContentId {
        return this.id;
    }

    getInboundDependencies(): ContentId[] {
        return this.inboundDependencies;
    }

    static fromJson(json: InboundDependenciesJson): InboundDependenciesResult {

        const contentId: ContentId = new ContentId(json.id.id);
        const inboundDependencies: ContentId[] = json.inboundDependencies
                                                 ? json.inboundDependencies.map(item => new ContentId(item.id))
                                                 : [];


        return new InboundDependenciesResult(contentId, inboundDependencies);
    }
}
