import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetPublishStatusesResult} from './GetPublishStatusesResult';
import {GetPublishStatusesResultJson} from './json/GetPublishStatusesResultJson';
import {ContentResourceRequest} from './ContentResourceRequest';

export class GetPublishStatusesRequest
    extends ContentResourceRequest<GetPublishStatusesResultJson, GetPublishStatusesResult> {

    private ids: string[];

    constructor(ids: string[]) {
        super();
        super.setMethod('POST');
        this.ids = ids;
        this.addRequestPathElements('getPublishStatuses');
    }

    getParams(): Object {
        return {
            ids: this.ids
        };
    }

    protected processResponse(response: JsonResponse<GetPublishStatusesResultJson>): GetPublishStatusesResult {
        return this.fromJsonToGetPublishStatusesResult(response.getResult());
    }

    fromJsonToGetPublishStatusesResult(json: GetPublishStatusesResultJson): GetPublishStatusesResult {
        return GetPublishStatusesResult.fromJson(json);
    }
}
