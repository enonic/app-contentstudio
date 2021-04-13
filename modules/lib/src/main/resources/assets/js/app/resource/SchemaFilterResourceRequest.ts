import {ProjectBasedResourceRequest} from '../wizard/ProjectBasedResourceRequest';
import {ContentId} from 'lib-admin-ui/content/ContentId';

export abstract class SchemaFilterResourceRequest<PARSED_TYPE>
    extends ProjectBasedResourceRequest<PARSED_TYPE> {

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

    setContentId(contentId: ContentId): SchemaFilterResourceRequest<PARSED_TYPE> {
        this.contentId = contentId;
        return this;
    }
}
