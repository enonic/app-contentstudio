import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryListJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {ContentTypeSummaryJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {SchemaFilterResourceRequest} from './SchemaFilterResourceRequest';

export class GetContentTypeDescriptorsRequest
    extends SchemaFilterResourceRequest<ContentTypeSummary[]> {

    constructor() {
        super();
        this.addRequestPathElements('contentTypes');
    }

    fromJsonToContentTypeSummary(json: ContentTypeSummaryJson): ContentTypeSummary {
        return ContentTypeSummary.fromJson(json);
    }

    protected parseResponse(response: JsonResponse<ContentTypeSummaryListJson>): ContentTypeSummary[] {
        return response.getResult().contentTypes.map((contentTypeJson: ContentTypeSummaryJson) => {
            return this.fromJsonToContentTypeSummary(contentTypeJson);
        });
    }
}
