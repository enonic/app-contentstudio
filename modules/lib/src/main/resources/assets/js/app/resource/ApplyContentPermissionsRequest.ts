import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {AccessControlList} from '../access/AccessControlList';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {ApplyPermissionsScope} from '../dialog/permissions/PermissionsData';

export class ApplyContentPermissionsRequest
    extends CmsContentResourceRequest<TaskId> {

    private id: ContentId;

    private permissions: AccessControlList;

    private addPermissions: AccessControlList;

    private removePermissions: AccessControlList;

    private scope: ApplyPermissionsScope;

    constructor() {
        super();
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

    setAddPermissions(addPermissions: AccessControlList): ApplyContentPermissionsRequest {
        this.addPermissions = addPermissions;
        return this;
    }

    setRemovePermissions(removePermissions: AccessControlList): ApplyContentPermissionsRequest {
        this.removePermissions = removePermissions;
        return this;
    }

    setScope(value: ApplyPermissionsScope): ApplyContentPermissionsRequest {
        this.scope = value;
        return this;
    }

    getParams(): object {
        return {
            contentId: this.id.toString(),
            permissions: this.permissions ? this.permissions.toJson() : undefined,
            addPermissions: this.addPermissions ? this.addPermissions.toJson() : undefined,
            removePermissions: this.removePermissions ? this.removePermissions.toJson() : undefined,
            scope: this.scope?.toUpperCase()
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }

}
