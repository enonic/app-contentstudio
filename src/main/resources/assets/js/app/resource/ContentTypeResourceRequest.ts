import {ContentType} from '../inputtype/schema/ContentType';
import {ContentTypeJson} from './json/ContentTypeJson';
import ContentTypeSummary = api.schema.content.ContentTypeSummary;

export class ContentTypeResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends api.rest.ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourceUrl: api.rest.Path;

    constructor() {
        super();
        this.resourceUrl = api.rest.Path.fromParent(super.getRestPath(), 'schema/content');
    }

    getResourcePath(): api.rest.Path {
        return this.resourceUrl;
    }

    fromJsonToContentType(json: ContentTypeJson): ContentType {
        return ContentType.fromJson(json);
    }

    fromJsonToContentTypeSummary(json: api.schema.content.ContentTypeSummaryJson): ContentTypeSummary {
        return ContentTypeSummary.fromJson(json);
    }
}
