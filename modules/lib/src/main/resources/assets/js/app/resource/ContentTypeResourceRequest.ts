import {ContentType} from '../inputtype/schema/ContentType';
import {ContentTypeJson} from './json/ContentTypeJson';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryJson} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {CmsResourceRequest} from './CmsResourceRequest';
import {ContentResourceRequest} from './ContentResourceRequest';

export abstract class ContentTypeResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    protected constructor() {
        super();
        this.addRequestPathElements('schema', ContentResourceRequest.CONTENT_PATH);
    }

    fromJsonToContentType(json: ContentTypeJson): ContentType {
        return ContentType.fromJson(json);
    }

    fromJsonToContentTypeSummary(json: ContentTypeSummaryJson): ContentTypeSummary {
        return ContentTypeSummary.fromJson(json);
    }
}
