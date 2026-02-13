import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type PermissionsJson} from '../access/PermissionsJson';
import {AccessControlList} from '../access/AccessControlList';
import {type ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetContentPermissionsByIdRequest
    extends CmsContentResourceRequest<AccessControlList> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('contentPermissions');
    }

    getParams(): object {
        return {
            id: this.contentId.toString()
        };
    }

    protected parseResponse(response: JsonResponse<PermissionsJson>): AccessControlList {
        return AccessControlList.fromJson(response.getResult());
    }
}
