import {ProjectResourceRequest} from './ProjectResourceRequest';
import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type ProjectJson} from './json/ProjectJson';
import {Project} from '../data/project/Project';
import {type ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';

export abstract class ProjectCreateUpdateRequest
    extends ProjectResourceRequest<Project> {

    protected name: string;

    protected displayName: string;

    protected description: string;

    protected applicationConfigs: ApplicationConfig[] = [];

    protected constructor() {
        super();
        this.setMethod(HttpMethod.POST);
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

    setApplicationConfigs(value: ApplicationConfig[]): ProjectCreateUpdateRequest {
        this.applicationConfigs = value || [];
        return this;
    }

    getParams(): object {
        return {
            name: this.name,
            displayName: this.displayName,
            description: this.description,
            applicationConfigs: this.applicationConfigs.map((config: ApplicationConfig) => config.toJson())
        };
    }

    protected parseResponse(response: JsonResponse<ProjectJson>): Project {
        return Project.fromJson(response.getResult());
    }
}
