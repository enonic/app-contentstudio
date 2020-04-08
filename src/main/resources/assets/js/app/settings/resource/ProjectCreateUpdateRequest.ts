import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ProjectPermissions} from '../data/project/ProjectPermissions';
import {ProjectJson} from './json/ProjectJson';
import {Project} from '../data/project/Project';
import {ProjectReadAccess} from '../data/project/ProjectReadAccess';

export abstract class ProjectCreateUpdateRequest
    extends ProjectResourceRequest<Project> {

    protected name: string;

    protected displayName: string;

    protected description: string;

    protected thumbnail: File;

    protected permissions: ProjectPermissions;

    protected readAccess: ProjectReadAccess;

    protected language: string;

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

    setPermissions(value: ProjectPermissions): ProjectCreateUpdateRequest {
        this.permissions = value;
        return this;
    }

    setReadAccess(value: ProjectReadAccess): ProjectCreateUpdateRequest {
        this.readAccess = value;
        return this;
    }

    setLanguage(value: string): ProjectCreateUpdateRequest {
        this.language = value;
        return this;
    }

    getParams(): Object {
        const params: any = {
            name: this.name,
            displayName: this.displayName,
            description: this.description,
            language: this.language
        };

        if (this.permissions) {
            params.permissions = JSON.stringify(this.permissions.toJson());
        }

        if (this.readAccess) {
            params.readAccess = JSON.stringify(this.readAccess.toJson());
        }

        if (this.thumbnail) {
            params.icon = this.thumbnail;
        }

        return params;
    }

    protected parseResponse(response: JsonResponse<ProjectJson>): Project {
        return Project.fromJson(response.getResult());
    }
}
