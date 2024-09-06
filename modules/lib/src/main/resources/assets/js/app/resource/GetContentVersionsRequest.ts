import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {GetContentVersionsForViewResultsJson} from './json/GetContentVersionsForViewResultsJson';
import {ContentVersions} from '../ContentVersions';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetContentVersionsRequest
    extends CmsContentResourceRequest<ContentVersions> {

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

    protected parseResponse(response: JsonResponse<GetContentVersionsForViewResultsJson>): ContentVersions {
        return ContentVersions.fromJson(response.getResult());
    }
}
