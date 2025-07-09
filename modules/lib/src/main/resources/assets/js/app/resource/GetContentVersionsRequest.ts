import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {GetContentVersionsResult} from './GetContentVersionsResult';
import {GetContentVersionsForViewResultsJson} from './json/GetContentVersionsForViewResultsJson';

export class GetContentVersionsRequest
    extends CmsContentResourceRequest<GetContentVersionsResult> {

    private contentId: ContentId;
    private from: number;
    private size: number;

    constructor(contentId: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentId = contentId;
        this.addRequestPathElements('getVersionsForView');
    }

    setFrom(from: number): GetContentVersionsRequest {
        this.from = from;
        return this;
    }

    setSize(size: number): GetContentVersionsRequest {
        this.size = size;
        return this;
    }

    getParams(): object {
        return {
            contentId: this.contentId.toString(),
            from: this.from,
            size: this.size || -1
        };
    }

    protected parseResponse(response: JsonResponse<GetContentVersionsForViewResultsJson>): GetContentVersionsResult {
        return GetContentVersionsResult.fromJson(response.getResult());
    }
}
