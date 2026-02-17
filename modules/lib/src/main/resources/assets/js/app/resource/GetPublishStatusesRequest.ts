import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {GetPublishStatusesResult} from './GetPublishStatusesResult';
import {type GetPublishStatusesResultJson} from './json/GetPublishStatusesResultJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetPublishStatusesRequest
    extends CmsContentResourceRequest<GetPublishStatusesResult> {

    private ids: string[];

    constructor(ids: string[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.addRequestPathElements('getPublishStatuses');
    }

    getParams(): object {
        return {
            ids: this.ids
        };
    }

    protected parseResponse(response: JsonResponse<GetPublishStatusesResultJson>): GetPublishStatusesResult {
        return this.fromJsonToGetPublishStatusesResult(response.getResult());
    }

    fromJsonToGetPublishStatusesResult(json: GetPublishStatusesResultJson): GetPublishStatusesResult {
        return GetPublishStatusesResult.fromJson(json);
    }
}
