import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetPublishStatusesResult} from './GetPublishStatusesResult';
import {GetPublishStatusesResultJson} from './json/GetPublishStatusesResultJson';
import {ContentResourceRequest} from './ContentResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class GetPublishStatusesRequest
    extends ContentResourceRequest<GetPublishStatusesResult> {

    private ids: string[];

    constructor(ids: string[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.addRequestPathElements('getPublishStatuses');
    }

    getParams(): Object {
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
