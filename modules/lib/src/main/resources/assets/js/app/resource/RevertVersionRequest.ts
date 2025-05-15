import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentVersionJson} from './json/ContentVersionJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {ContentId} from '../content/ContentId';

export class RevertVersionRequest
    extends CmsContentResourceRequest<string> {

    private readonly versionId: string;

    private readonly contentId: ContentId;

    constructor(versionId: string, contentId: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        this.versionId = versionId;
        this.contentId = contentId;
        this.addRequestPathElements('revert');
    }

    getParams(): object {
        return {
            versionId: this.versionId,
            contentId: this.contentId.toString(),
        };
    }

    protected parseResponse(response: JsonResponse<ContentVersionJson>): string {
        if (this.versionId === response.getResult().id) {
            return null;
        }
        return response.getResult().id;
    }
}
