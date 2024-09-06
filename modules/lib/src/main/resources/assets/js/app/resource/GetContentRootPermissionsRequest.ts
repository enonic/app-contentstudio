import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {PermissionsJson} from '../access/PermissionsJson';
import {AccessControlList} from '../access/AccessControlList';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetContentRootPermissionsRequest
    extends CmsContentResourceRequest<AccessControlList> {

    constructor() {
        super();
        this.addRequestPathElements('rootPermissions');
    }

    getParams(): object {
        return {};
    }

    protected parseResponse(response: JsonResponse<PermissionsJson>): AccessControlList {
        return AccessControlList.fromJson(response.getResult());
    }
}
