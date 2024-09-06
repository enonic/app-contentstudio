import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Permission} from '../access/Permission';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetPermittedActionsRequest
    extends CmsContentResourceRequest<Permission[]> {

    private contentIds: ContentId[] = [];

    private permissions: Permission[] = [];

    /*
     When no contentIds provided - looking for root permissions
     When no permissions provided - checking all possible permissions
     */

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('allowedActions');
    }

    addContentIds(...contentIds: ContentId[]): GetPermittedActionsRequest {
        this.contentIds.push(...contentIds);
        return this;
    }

    addPermissionsToBeChecked(...permissions: Permission[]): GetPermittedActionsRequest {
        this.permissions.push(...permissions);
        return this;
    }

    getParams(): object {
        let fn = (contentId: ContentId) => {
            return contentId.toString();
        };
        let fn2 = (permission: Permission) => {
            return Permission[permission];
        };

        return {
            contentIds: this.contentIds.map(fn),
            permissions: this.permissions.map(fn2)
        };
    }

    protected parseResponse(response: JsonResponse<string[]>): Permission[] {
        let result = [];

        response.getResult().forEach((entry: string) => {
            result.push(Permission[entry]);
        });

        return result;
    }
}
