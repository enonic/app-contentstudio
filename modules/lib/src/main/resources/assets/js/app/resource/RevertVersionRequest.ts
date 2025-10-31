import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentId} from '../content/ContentId';
import {ContentVersionJson} from './json/ContentVersionJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class RevertVersionRequest
    extends CmsContentResourceRequest<string> {

    private readonly versionId: string;

    private readonly contentKey: string;

    constructor(versionId: string, contentId: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        this.versionId = versionId;
        this.contentKey = contentId.toString();
        this.addRequestPathElements('revert');
    }

    getParams(): object {
        return {
            versionId: this.versionId,
            contentKey: this.contentKey
        };
    }

    protected parseResponse(response: JsonResponse<ContentVersionJson>): string {
        if (this.versionId === response.getResult().id) {
            return null;
        }
        return response.getResult().id;
    }
}
