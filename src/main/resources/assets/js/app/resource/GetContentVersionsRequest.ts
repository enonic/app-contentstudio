import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetContentVersionsForViewResultsJson} from './json/GetContentVersionsForViewResultsJson';
import {ContentVersions} from '../ContentVersions';
import {ContentResourceRequest} from './ContentResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class GetContentVersionsRequest
    extends ContentResourceRequest<ContentVersions> {

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

    getParams(): Object {
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
