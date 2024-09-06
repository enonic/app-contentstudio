import * as Q from 'q';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ListContentResult} from './ListContentResult';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentSummary} from '../content/ContentSummary';
import {ContentId} from '../content/ContentId';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetContentSummaryByIds
    extends CmsContentResourceRequest<ContentSummary[]> {

    private readonly ids: ContentId[];

    constructor(ids: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.addRequestPathElements('resolveByIds');
    }

    getParams(): object {
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
