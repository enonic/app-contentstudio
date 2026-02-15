import {type ContentId} from '../content/ContentId';
import {CmsProjectBasedResourceRequest} from '../wizard/CmsProjectBasedResourceRequest';
import {ContentPath} from '../content/ContentPath';

export abstract class SchemaFilterBasedRequest<T>
    extends CmsProjectBasedResourceRequest<T[]> {

    private contentId: ContentId;

    constructor() {
        super();
        this.setContentRootPath(ContentPath.CONTENT_ROOT);
        this.addRequestPathElements('schema', 'filter');
    }

    getParams(): object {
        return {
            contentId: this.contentId?.toString()
        };
    }

    setContentId(contentId: ContentId): SchemaFilterBasedRequest<T> {
        this.contentId = contentId;
        return this;
    }
}
