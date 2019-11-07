import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {EffectivePermissionJson} from './json/EffectivePermissionJson';
import {EffectivePermission} from '../security/EffectivePermission';

export class GetEffectivePermissionsRequest
    extends ContentResourceRequest<EffectivePermissionJson[], EffectivePermission[]> {

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
        return Path.fromParent(super.getResourcePath(), 'effectivePermissions');
    }

    sendAndParse(): Q.Promise<EffectivePermission[]> {

        return this.send().then((response: JsonResponse<EffectivePermissionJson[]>) => {
            if (response.getJson()) {
                return response.getJson().map((json) => {
                    return EffectivePermission.fromJson(json);
                });
            }
            return null;
        });
    }
}
