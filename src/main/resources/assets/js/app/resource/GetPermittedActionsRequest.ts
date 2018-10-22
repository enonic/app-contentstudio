import ContentId = api.content.ContentId;
import {ContentResourceRequest} from './ContentResourceRequest';
import {Permission} from '../access/Permission';

export class GetPermittedActionsRequest
    extends ContentResourceRequest<string[], Permission[]> {

    private contentIds: ContentId[] = [];

    private permissions: Permission[] = [];

    /*
     When no contentIds provided - looking for root permissions
     When no permissions provided - checking all possible permissions
     */

    constructor() {
        super();
        super.setMethod('POST');
    }

    addContentIds(...contentIds: ContentId[]): GetPermittedActionsRequest {
        this.contentIds.push(...contentIds);
        return this;
    }

    addPermissionsToBeChecked(...permissions: Permission[]): GetPermittedActionsRequest {
        this.permissions.push(...permissions);
        return this;
    }

    getParams(): Object {
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

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'allowedActions');
    }

    sendAndParse(): wemQ.Promise<Permission[]> {

        return this.send().then((response: api.rest.JsonResponse<string[]>) => {
            let result = [];

            response.getResult().forEach((entry: string) => {
                result.push(Permission[entry]);
            });

            return result;
        });
    }
}
