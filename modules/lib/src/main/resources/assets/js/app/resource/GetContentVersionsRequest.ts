import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {GetContentVersionsResult} from './GetContentVersionsResult';
import {GetContentVersionsForViewResultsJson} from './json/GetContentVersionsForViewResultsJson';

export class GetContentVersionsRequest
    extends CmsContentResourceRequest<GetContentVersionsResult> {

    private contentId: ContentId;
    private size: number;
    private cursor?: string;

    constructor(contentId: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentId = contentId;
        this.addRequestPathElements('getVersions');
    }

    setCursor(cursor?: string): GetContentVersionsRequest {
        this.cursor = cursor;
        return this;
    }

    setSize(size: number): GetContentVersionsRequest {
        this.size = size;
        return this;
    }

    getParams(): object {
        const params: {
            contentId: string;
            size: number;
            cursor?: string;
        } = {
            contentId: this.contentId.toString(),
            size: this.size || -1
        };

        if (this.cursor) {
            params.cursor = this.cursor;
        }

        return params;
    }

    protected parseResponse(response: JsonResponse<GetContentVersionsForViewResultsJson>): GetContentVersionsResult {
        return GetContentVersionsResult.fromJson(response.getResult());
    }
}
