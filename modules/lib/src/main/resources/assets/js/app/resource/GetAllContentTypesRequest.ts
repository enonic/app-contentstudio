import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryJson} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {ContentTypeSummaryListJson} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryListJson';

export class GetAllContentTypesRequest
    extends ContentTypeResourceRequest<ContentTypeSummary[]> {

    constructor() {
        super();
        this.addRequestPathElements('all');
    }

    protected parseResponse(response: JsonResponse<ContentTypeSummaryListJson>): ContentTypeSummary[] {
        return response.getResult().contentTypes.map((contentTypeJson: ContentTypeSummaryJson) => {
            return this.fromJsonToContentTypeSummary(contentTypeJson);
        });
    }
}
