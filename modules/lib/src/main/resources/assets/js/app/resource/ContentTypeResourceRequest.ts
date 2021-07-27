import {ContentType} from '../inputtype/schema/ContentType';
import {ContentTypeJson} from './json/ContentTypeJson';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {CmsProjectBasedResourceRequest} from '../wizard/CmsProjectBasedResourceRequest';

export abstract class ContentTypeResourceRequest<PARSED_TYPE>
    extends CmsProjectBasedResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('schema', 'content');
    }

    fromJsonToContentType(json: ContentTypeJson): ContentType {
        return ContentType.fromJson(json);
    }

    fromJsonToContentTypeSummary(json: ContentTypeSummaryJson): ContentTypeSummary {
        return ContentTypeSummary.fromJson(json);
    }
}
