import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {PermissionsJson} from '../access/PermissionsJson';
import {AccessControlList} from '../access/AccessControlList';

export class GetContentPermissionsByIdRequest
    extends ContentResourceRequest<PermissionsJson, AccessControlList> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        super.setMethod('GET');
        this.contentId = contentId;
    }

    getParams(): Object {
        return {
            id: this.contentId.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'contentPermissions');
    }

    sendAndParse(): Q.Promise<AccessControlList> {

        return this.send().then((response: JsonResponse<PermissionsJson>) => {
            return AccessControlList.fromJson(response.getResult());
        });
    }
}
