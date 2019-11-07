import {Path} from 'lib-admin-ui/rest/Path';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {ContentType} from '../inputtype/schema/ContentType';
import {ContentTypeJson} from './json/ContentTypeJson';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryJson';

export class ContentTypeResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourceUrl: Path;

    constructor() {
        super();
        this.resourceUrl = Path.fromParent(super.getRestPath(), 'schema/content');
    }

    getResourcePath(): Path {
        return this.resourceUrl;
    }

    fromJsonToContentType(json: ContentTypeJson): ContentType {
        return ContentType.fromJson(json);
    }

    fromJsonToContentTypeSummary(json: ContentTypeSummaryJson): ContentTypeSummary {
        return ContentTypeSummary.fromJson(json);
    }
}
