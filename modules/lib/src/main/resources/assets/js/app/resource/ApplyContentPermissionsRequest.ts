import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {AccessControlList} from '../access/AccessControlList';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class ApplyContentPermissionsRequest
    extends CmsContentResourceRequest<TaskId> {

    private id: ContentId;

    private permissions: AccessControlList;

    private overwriteChildPermissions: boolean;

    constructor() {
        super();
        this.overwriteChildPermissions = false;
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('applyPermissions');
    }

    setId(id: ContentId): ApplyContentPermissionsRequest {
        this.id = id;
        return this;
    }

    setPermissions(permissions: AccessControlList): ApplyContentPermissionsRequest {
        this.permissions = permissions;
        return this;
    }

    /*
    * @deprecated Use new API instead
    * */
    setInheritPermissions(inheritPermissions: boolean): ApplyContentPermissionsRequest {
        return this;
    }

    /*
    * @deprecated Use new API instead
    * */
    setOverwriteChildPermissions(overwriteChildPermissions: boolean): ApplyContentPermissionsRequest {
        this.overwriteChildPermissions = overwriteChildPermissions;
        return this;
    }

    getParams(): object {
        return {
            contentId: this.id.toString(),
            permissions: this.permissions ? this.permissions.toJson() : undefined,
            scope: this.overwriteChildPermissions ? 'TREE' : 'SINGLE'
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }

}
