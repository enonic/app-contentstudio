import ContentId = api.content.ContentId;
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

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'effectivePermissions');
    }

    sendAndParse(): wemQ.Promise<EffectivePermission[]> {

        return this.send().then((response: api.rest.JsonResponse<EffectivePermissionJson[]>) => {
            if (response.getJson()) {
                return response.getJson().map((json) => {
                    return EffectivePermission.fromJson(json);
                });
            }
            return null;
        });
    }
}
