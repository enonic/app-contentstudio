import ContentId = api.content.ContentId;
import {ContentResourceRequest} from './ContentResourceRequest';

export class RevertVersionRequest
    extends ContentResourceRequest<any, any> {

    private versionId: string;

    private contentKey: string;

    constructor(versionId: string, contentKey: string) {
        super();
        super.setMethod('POST');
        this.versionId = versionId;
        this.contentKey = contentKey;
    }

    getParams(): Object {
        return {
            versionId: this.versionId,
            contentKey: this.contentKey
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'revert');
    }

    sendAndParse(): wemQ.Promise<ContentId> {

        return this.send().then((response: api.rest.JsonResponse<any>) => {
            return new ContentId(response.getResult()['id']);
        });
    }
}
