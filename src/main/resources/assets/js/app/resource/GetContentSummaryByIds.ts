import * as Q from 'q';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ListContentResult} from './ListContentResult';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class GetContentSummaryByIds
    extends ContentResourceRequest<ContentSummary[]> {

    private ids: ContentId[];

    constructor(ids: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.addRequestPathElements('resolveByIds');
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    sendAndParse(): Q.Promise<ContentSummary[]> {
        if (this.ids && this.ids.length > 0) {
            return super.sendAndParse();
        }

        return Q([]);
    }

    protected parseResponse(response: JsonResponse<ListContentResult<ContentSummaryJson>>): ContentSummary[] {
        return ContentSummary.fromJsonArray(response.getResult().contents);
    }

}
