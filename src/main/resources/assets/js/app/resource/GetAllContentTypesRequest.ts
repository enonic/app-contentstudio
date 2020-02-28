import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryListJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {ContentTypeSummaryJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryJson';

export class GetAllContentTypesRequest
    extends ContentTypeResourceRequest<ContentTypeSummaryListJson, ContentTypeSummary[]> {

    constructor() {
        super();
        this.addRequestPathElements('all');
    }

    protected processResponse(response: JsonResponse<ContentTypeSummaryListJson>): ContentTypeSummary[] {
        return response.getResult().contentTypes.map((contentTypeJson: ContentTypeSummaryJson) => {
            return this.fromJsonToContentTypeSummary(contentTypeJson);
        });
    }
}
