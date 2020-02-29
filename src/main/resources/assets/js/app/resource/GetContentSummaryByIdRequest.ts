import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentResourceRequest} from './ContentResourceRequest';

export class GetContentSummaryByIdRequest
    extends ContentResourceRequest<ContentSummaryJson, ContentSummary> {

    private id: ContentId;

    private expand: string;

    constructor(id: ContentId) {
        super();
        this.id = id;
        this.expand = ContentResourceRequest.EXPAND_SUMMARY;
    }

    getParams(): Object {
        return {
            id: this.id.toString(),
            expand: this.expand
        };
    }

    protected processResponse(response: JsonResponse<ContentSummaryJson>): ContentSummary {
        return this.fromJsonToContentSummary(response.getResult());
    }
}
