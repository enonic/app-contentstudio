import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'revert');
    }

    sendAndParse(): Q.Promise<string> {
        return this.send().then((response: JsonResponse<ContentVersionJson>) => {
            return response.getResult().id;
        });
    }
}
