import {ProjectPermissions} from '../data/project/ProjectPermissions';
import {type ProjectPermissionsJson} from './json/ProjectPermissionsJson';
import {ProjectResourceRequest} from './ProjectResourceRequest';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';

export class UpdateProjectPermissionsRequest
    extends ProjectResourceRequest<ProjectPermissions> {

    private name: string;

    private permissions: ProjectPermissions;

    private viewers: PrincipalKey[] = [];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('modifyPermissions');
    }

    setName(value: string): UpdateProjectPermissionsRequest {
        this.name = value;
        return this;
    }

    setPermissions(value: ProjectPermissions): UpdateProjectPermissionsRequest {
        this.permissions = value;
        return this;
    }

    setViewers(value: PrincipalKey[]): UpdateProjectPermissionsRequest {
        this.viewers = value;
        return this;
    }

    getParams(): object {
        const params: { name: string, permissions?: ProjectPermissionsJson } = {
            name: this.name
        };

        if (this.permissions) {
            params.permissions = this.permissions.toJson();

            if (this.viewers) {
                params.permissions.viewer = this.viewers.map((key: PrincipalKey) => key.toString());
            }
        }

        return params;
    }

    protected parseResponse(response: JsonResponse<ProjectPermissionsJson>): ProjectPermissions {
        return ProjectPermissions.fromJson(response.getResult());
    }
}
