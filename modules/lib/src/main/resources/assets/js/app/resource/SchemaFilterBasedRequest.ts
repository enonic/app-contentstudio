import {ProjectBasedResourceRequest} from '../wizard/ProjectBasedResourceRequest';
import {ContentId} from '../content/ContentId';

export abstract class SchemaFilterBasedRequest<T>
    extends ProjectBasedResourceRequest<T[]> {

    private contentId: ContentId;

    constructor() {
        super();
        this.addRequestPathElements('schema', 'filter');
    }

    getParams(): Object {
        return {
            contentId: this.contentId?.toString()
        };
    }

    setContentId(contentId: ContentId): SchemaFilterBasedRequest<T> {
        this.contentId = contentId;
        return this;
    }
}
