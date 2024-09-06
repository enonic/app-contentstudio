import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentVersionJson} from './json/ContentVersionJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class RevertVersionRequest
    extends CmsContentResourceRequest<string> {

    private versionId: string;

    private contentKey: string;

    constructor(versionId: string, contentKey: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.versionId = versionId;
        this.contentKey = contentKey;
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
