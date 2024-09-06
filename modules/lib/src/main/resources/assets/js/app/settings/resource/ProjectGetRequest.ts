import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Project} from '../data/project/Project';
import {ProjectJson} from './json/ProjectJson';

export class ProjectGetRequest
    extends ProjectResourceRequest<Project> {

    private readonly name: string;

    constructor(name: string) {
        super();

        this.name = name;
        this.addRequestPathElements('get');
    }

    getParams(): object {
        return {
            name: this.name
        };
    }

    protected parseResponse(response: JsonResponse<ProjectJson>): Project {
        return Project.fromJson(response.getResult());
    }
}
