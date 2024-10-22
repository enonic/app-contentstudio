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

    private inheritPermissions: boolean;

    private overwriteChildPermissions: boolean;

    constructor() {
        super();
        this.inheritPermissions = true;
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

    setInheritPermissions(inheritPermissions: boolean): ApplyContentPermissionsRequest {
        this.inheritPermissions = inheritPermissions;
        return this;
    }

    setOverwriteChildPermissions(overwriteChildPermissions: boolean): ApplyContentPermissionsRequest {
        this.overwriteChildPermissions = overwriteChildPermissions;
        return this;
    }

    getParams(): object {
        return {
            contentId: this.id.toString(),
            permissions: this.permissions ? this.permissions.toJson() : undefined,
            inheritPermissions: this.inheritPermissions,
            overwriteChildPermissions: this.overwriteChildPermissions
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }

}
