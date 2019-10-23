import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'rootPermissions');
    }

    sendAndParse(): Q.Promise<AccessControlList> {

        return this.send().then((response: JsonResponse<PermissionsJson>) => {
            return AccessControlList.fromJson(response.getResult());
        });
    }
}
