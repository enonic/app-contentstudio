import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {ContentId} from '../content/ContentId';

export class GetContentSummaryByIdRequest
    extends ContentResourceRequest<ContentSummary> {

    private id: ContentId;

    private readonly expand: string;

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

    protected parseResponse(response: JsonResponse<ContentSummaryJson>): ContentSummary {
        return this.fromJsonToContentSummary(response.getResult());
    }
}
