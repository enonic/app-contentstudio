import ContentSummaryJson = api.content.json.ContentSummaryJson;
import ContentSummary = api.content.ContentSummary;
import ContentId = api.content.ContentId;
import {ContentResourceRequest} from './ContentResourceRequest';
import {ListContentResult} from './ListContentResult';

export class GetContentSummaryByIds
    extends ContentResourceRequest<ListContentResult<ContentSummaryJson>, ContentSummary[]> {

    private ids: ContentId[];

    constructor(ids: ContentId[]) {
        super();
        super.setMethod('POST');
        this.ids = ids;
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'resolveByIds');
    }

    sendAndParse(): wemQ.Promise<ContentSummary[]> {
        if (this.ids && this.ids.length > 0) {
            return this.send().then((response: api.rest.JsonResponse<ListContentResult<ContentSummaryJson>>) => {
                return ContentSummary.fromJsonArray(response.getResult().contents);
            });
        } else {
            let deferred = wemQ.defer<ContentSummary[]>();
            deferred.resolve([]);
            return deferred.promise;
        }
    }

}
