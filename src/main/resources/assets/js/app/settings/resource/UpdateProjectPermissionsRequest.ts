import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ProjectPermissions} from '../data/project/ProjectPermissions';
import {ProjectReadAccess} from '../data/project/ProjectReadAccess';
import {TaskWaitResourceRequest} from 'lib-admin-ui/rest/TaskWaitResourceRequest';

export class UpdateProjectPermissionsRequest extends TaskWaitResourceRequest<void> {

    private name: string;

    private permissions: ProjectPermissions;

    private readAccess: ProjectReadAccess;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('project', 'modifyPermissions');
    }

    setName(value: string): UpdateProjectPermissionsRequest {
        this.name = value;
        return this;
    }

    setPermissions(value: ProjectPermissions): UpdateProjectPermissionsRequest {
        this.permissions = value;
        return this;
    }

    setReadAccess(value: ProjectReadAccess): UpdateProjectPermissionsRequest {
        this.readAccess = value;
        return this;
    }

    getParams(): Object {
        const params: any = {
            name: this.name
        };

        if (this.permissions) {
            params.permissions = this.permissions.toJson();
        }

        if (this.readAccess) {
            params.readAccess = this.readAccess.toJson();
        }

        return params;
    }

}
