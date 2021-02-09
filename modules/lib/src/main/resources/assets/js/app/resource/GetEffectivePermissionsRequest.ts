import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {EffectivePermissionJson} from './json/EffectivePermissionJson';
import {EffectivePermission} from '../security/EffectivePermission';

export class GetEffectivePermissionsRequest
    extends ContentResourceRequest<EffectivePermission[]> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('effectivePermissions');
    }

    getParams(): Object {
        return {
            id: this.contentId.toString()
        };
    }

    protected parseResponse(response: JsonResponse<EffectivePermissionJson[]>): EffectivePermission[] {
        if (response.getJson()) {
            return response.getJson().map((json) => {
                return EffectivePermission.fromJson(json);
            });
        }
        return null;
    }
}
