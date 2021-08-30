import {ContentId} from '../content/ContentId';
import {ResolveContentForDeleteJson} from './json/ResolveContentForDeleteJson';

export class ResolveContentForDeleteResult {

    private readonly contentIds: ContentId[];

    private readonly inboundDependencies: ContentId[];

    constructor(contentIds: ContentId[], inboundDependencies: ContentId[]) {

        this.contentIds = contentIds;
        this.inboundDependencies = inboundDependencies;
    }

    getContentIds(): ContentId[] {
        return this.contentIds;
    }

    getInboundDependencies(): ContentId[] {
        return this.inboundDependencies;
    }

    static fromJson(json: ResolveContentForDeleteJson): ResolveContentForDeleteResult {

        const contentIds: ContentId[] = json.contentIds
                                        ? json.contentIds.map(item => new ContentId(item.id))
                                        : [];
        const inboundDependencies: ContentId[] = json.inboundDependencies
                                                 ? json.inboundDependencies.map(item => new ContentId(item.id))
                                                 : [];


        return new ResolveContentForDeleteResult(contentIds, inboundDependencies);
    }
}
