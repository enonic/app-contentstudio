import ContentId = api.content.ContentId;
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

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'contentPermissions');
    }

    sendAndParse(): wemQ.Promise<AccessControlList> {

        return this.send().then((response: api.rest.JsonResponse<PermissionsJson>) => {
            return AccessControlList.fromJson(response.getResult());
        });
    }
}
