import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentVersionJson} from './json/ContentVersionJson';

export class RevertVersionRequest
    extends ContentResourceRequest<ContentVersionJson, string> {

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

    sendAndParse(): wemQ.Promise<string> {
        return this.send().then((response: api.rest.JsonResponse<ContentVersionJson>) => {
            return response.getResult().id;
        });
    }
}
