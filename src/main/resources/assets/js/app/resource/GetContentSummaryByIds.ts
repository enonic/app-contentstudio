import * as Q from 'q';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ListContentResult} from './ListContentResult';

export class GetContentSummaryByIds
    extends ContentResourceRequest<ListContentResult<ContentSummaryJson>, ContentSummary[]> {

    private ids: ContentId[];

    constructor(ids: ContentId[]) {
        super();
        super.setMethod('POST');
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
            return this.send().then((response: JsonResponse<ListContentResult<ContentSummaryJson>>) => {
                return this.processResponse(response);
            });
        } else {
            let deferred = Q.defer<ContentSummary[]>();
            deferred.resolve([]);
            return deferred.promise;
        }
    }

    protected processResponse(response: JsonResponse<ListContentResult<ContentSummaryJson>>): ContentSummary[] {
        return ContentSummary.fromJsonArray(response.getResult().contents);
    }

}
