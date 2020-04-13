import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ProjectJson} from './json/ProjectJson';
import {Project} from '../data/project/Project';

export abstract class ProjectCreateUpdateRequest
    extends ProjectResourceRequest<Project> {

    protected name: string;

    protected displayName: string;

    protected description: string;

    protected thumbnail: File;

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

    getParams(): Object {
        const params: any = {
            name: this.name,
            displayName: this.displayName,
            description: this.description
        };

        if (this.thumbnail) {
            params.icon = this.thumbnail;
        }

        return params;
    }

    protected parseResponse(response: JsonResponse<ProjectJson>): Project {
        return Project.fromJson(response.getResult());
    }
}
