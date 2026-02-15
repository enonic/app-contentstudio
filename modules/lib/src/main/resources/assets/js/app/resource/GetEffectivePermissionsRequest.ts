import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type EffectivePermissionJson} from './json/EffectivePermissionJson';
import {EffectivePermission} from '../security/EffectivePermission';
import {type ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetEffectivePermissionsRequest
    extends CmsContentResourceRequest<EffectivePermission[]> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('effectivePermissions');
    }

    getParams(): object {
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
