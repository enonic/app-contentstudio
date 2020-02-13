import {ProjectResourceRequest} from './ProjectResourceRequest';
import {ProjectItemJson} from './json/ProjectItemJson';
import {ProjectItem} from '../data/ProjectItem';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ProjectItemPermissions} from '../data/ProjectItemPermissions';

export abstract class ProjectCreateUpdateRequest
    extends ProjectResourceRequest<ProjectItemJson, ProjectItem> {

    protected name: string;

    protected displayName: string;

    protected description: string;

    protected thumbnail: File;

    protected permissions: ProjectItemPermissions;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.setIsFormRequest(true);
    }

    setName(value: string): ProjectCreateUpdateRequest {
        this.name = value;
        return this;
    }

    setDisplayName(value: string): ProjectCreateUpdateRequest {
        this.displayName = value;
        return this;
    }

    setDescription(value: string): ProjectCreateUpdateRequest {
        this.description = value;
        return this;
    }

    setThumbnail(value: File): ProjectCreateUpdateRequest {
        this.thumbnail = value;
        return this;
    }

    setPermissions(value: ProjectItemPermissions): ProjectCreateUpdateRequest {
        this.permissions = value;
        return this;
    }

    getParams(): Object {
        const params: any = {
            name: this.name,
            displayName: this.displayName,
            description: this.description,
            permissions: JSON.stringify(this.permissions.toJson())
        };

        if (this.thumbnail) {
            params.icon = this.thumbnail;
        }

        return params;
    }

    protected processResponse(response: JsonResponse<ProjectItemJson>): ProjectItem {
        return ProjectItem.fromJson(response.getResult());
    }
}
