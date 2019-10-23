import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';

export class SetActiveContentVersionRequest
    extends ContentResourceRequest<any, any> {

    private versionId: string;

    private contentId: ContentId;

    constructor(versionId: string, contentId: ContentId) {
        super();
        super.setMethod('POST');
        this.versionId = versionId;
        this.contentId = contentId;
    }

    getParams(): Object {
        return {
            versionId: this.versionId,
            contentId: this.contentId.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'setActiveVersion');
    }

    sendAndParse(): Q.Promise<ContentId> {

        return this.send().then((response: JsonResponse<any>) => {
            return new ContentId(response.getResult()['id']);
        });
    }
}
