import {ContentResourceRequest} from './ContentResourceRequest';
import {PermissionsJson} from '../access/PermissionsJson';
import {AccessControlList} from '../access/AccessControlList';

export class GetContentRootPermissionsRequest
    extends ContentResourceRequest<PermissionsJson, AccessControlList> {

    constructor() {
        super();
        super.setMethod('GET');
    }

    getParams(): Object {
        return {};
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'rootPermissions');
    }

    sendAndParse(): wemQ.Promise<AccessControlList> {

        return this.send().then((response: api.rest.JsonResponse<PermissionsJson>) => {
            return AccessControlList.fromJson(response.getResult());
        });
    }
}
