import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ActiveContentVersion} from '../ActiveContentVersion';
import {type ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {type GetActiveContentVersionsResultsJson} from './json/GetActiveContentVersionsResultsJson';

export class GetActiveContentVersionsRequest
    extends CmsContentResourceRequest<ActiveContentVersion[]> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('getActiveVersions');
    }

    getParams(): object {
        return {
            id: this.contentId.toString(),
        };
    }

    protected parseResponse(response: JsonResponse<GetActiveContentVersionsResultsJson>): ActiveContentVersion[] {
        return response.getResult().activeContentVersions.map(ActiveContentVersion.fromJson);
    }
}
