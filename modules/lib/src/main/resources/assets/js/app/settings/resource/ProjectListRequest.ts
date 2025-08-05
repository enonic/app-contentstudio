import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Project} from '../data/project/Project';
import {ProjectJson} from './json/ProjectJson';
import {ProjectHelper} from '../data/project/ProjectHelper';

export class ProjectListRequest
    extends ProjectResourceRequest<Project[]> {

    private readonly resolveUnavailable: boolean;

    constructor(resolveUnavailable?: boolean) {
        super();
        this.addRequestPathElements('list');
        this.resolveUnavailable = resolveUnavailable;
    }

    getParams(): object {
        return {
            resolveUnavailable: !!this.resolveUnavailable,
        };
    }

    protected parseResponse(response: JsonResponse<ProjectJson[]>): Project[] {
        return response.getResult()['projects'].map(Project.fromJson).sort(ProjectHelper.sortProjects);
    }
}
