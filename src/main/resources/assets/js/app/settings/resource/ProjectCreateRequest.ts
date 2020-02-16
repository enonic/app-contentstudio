import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ProjectJson} from './json/ProjectJson';
import {Project} from '../data/project/Project';

export class ProjectCreateRequest
    extends ProjectResourceRequest<ProjectJson, Project> {

    private name: string;

    private displayName: string;

    private description: string;

    private thumbnail: File;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.setIsFormRequest(true);
        this.addRequestPathElements('create');
    }

    setName(value: string): ProjectCreateRequest {
        this.name = value;
        return this;
    }

    setDisplayName(value: string): ProjectCreateRequest {
        this.displayName = value;
        return this;
    }

    setDescription(value: string): ProjectCreateRequest {
        this.description = value;
        return this;
    }

    setThumbnail(value: File): ProjectCreateRequest {
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

    protected processResponse(response: JsonResponse<ProjectJson>): Project {
        return Project.fromJson(response.getResult());
    }
}
