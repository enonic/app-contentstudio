import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {PermissionsJson} from '../access/PermissionsJson';
import {AccessControlList} from '../access/AccessControlList';

export class GetContentPermissionsByIdRequest
    extends ContentResourceRequest<AccessControlList> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('contentPermissions');
    }

    getParams(): Object {
        return {
            id: this.contentId.toString()
        };
    }

    protected parseResponse(response: JsonResponse<PermissionsJson>): AccessControlList {
        return AccessControlList.fromJson(response.getResult());
    }
}
