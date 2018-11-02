import ContentId = api.content.ContentId;
import TaskId = api.task.TaskId;
import TaskIdJson = api.task.TaskIdJson;
import {ContentResourceRequest} from './ContentResourceRequest';
import {AccessControlList} from '../access/AccessControlList';

export class ApplyContentPermissionsRequest
    extends ContentResourceRequest<TaskIdJson, TaskId> {

    private id: ContentId;

    private permissions: AccessControlList;

    private inheritPermissions: boolean;

    private overwriteChildPermissions: boolean;

    constructor() {
        super();
        this.inheritPermissions = true;
        this.overwriteChildPermissions = false;
        this.setMethod('POST');
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

    getParams(): Object {
        return {
            contentId: this.id.toString(),
            permissions: this.permissions ? this.permissions.toJson() : undefined,
            inheritPermissions: this.inheritPermissions,
            overwriteChildPermissions: this.overwriteChildPermissions
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'applyPermissions');
    }

    sendAndParse(): wemQ.Promise<TaskId> {

        return this.send().then((response: api.rest.JsonResponse<TaskIdJson>) => {
            return api.task.TaskId.fromJson(response.getResult());
        });
    }

}
