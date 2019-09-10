import {ContentType} from '../inputtype/schema/ContentType';
import {ContentTypeJson} from './json/ContentTypeJson';
import {LayerBasedResourceRequest} from './LayerBasedResourceRequest';
import ContentTypeSummary = api.schema.content.ContentTypeSummary;

export class ContentTypeResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends LayerBasedResourceRequest<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
    }

    getResourcePath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'schema/content');
    }

    fromJsonToContentType(json: ContentTypeJson): ContentType {
        return ContentType.fromJson(json);
    }

    fromJsonToContentTypeSummary(json: api.schema.content.ContentTypeSummaryJson): ContentTypeSummary {
        return ContentTypeSummary.fromJson(json);
    }
}
