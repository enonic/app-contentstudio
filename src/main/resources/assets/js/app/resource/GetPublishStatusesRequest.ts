import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
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
    }

    getParams(): Object {
        return {
            ids: this.ids
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getPublishStatuses');
    }

    sendAndParse(): Q.Promise<GetPublishStatusesResult> {
        return this.send().then((response: JsonResponse<GetPublishStatusesResultJson>) => {
            return this.fromJsonToGetPublishStatusesResult(response.getResult());
        });
    }

    fromJsonToGetPublishStatusesResult(json: GetPublishStatusesResultJson): GetPublishStatusesResult {
        return GetPublishStatusesResult.fromJson(json);
    }
}
