import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Project} from '../data/project/Project';
import {ProjectJson} from './json/ProjectJson';
import {ProjectHelper} from '../data/project/ProjectHelper';

export class ProjectListRequest
    extends ProjectResourceRequest<Project[]> {

    constructor() {
        super();
        this.addRequestPathElements('list');
    }

    protected parseResponse(response: JsonResponse<ProjectJson[]>): Project[] {
        return response.getResult()['projects'].map(Project.fromJson).sort(ProjectHelper.sortProjects);
    }
}
