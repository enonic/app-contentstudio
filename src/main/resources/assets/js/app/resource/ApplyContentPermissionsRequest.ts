import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {TaskIdJson} from 'lib-admin-ui/task/TaskIdJson';
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'applyPermissions');
    }

    sendAndParse(): Q.Promise<TaskId> {

        return this.send().then((response: JsonResponse<TaskIdJson>) => {
            return TaskId.fromJson(response.getResult());
        });
    }

}
