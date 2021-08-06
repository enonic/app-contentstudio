import {ContentId} from '../content/ContentId';
import {CmsProjectBasedResourceRequest} from '../wizard/CmsProjectBasedResourceRequest';

export abstract class SchemaFilterBasedRequest<T>
    extends CmsProjectBasedResourceRequest<T[]> {

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
