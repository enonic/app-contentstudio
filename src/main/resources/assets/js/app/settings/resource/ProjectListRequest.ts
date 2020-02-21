import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Project} from '../data/project/Project';
import {ProjectJson} from './json/ProjectJson';

export class ProjectListRequest
    extends ProjectResourceRequest<ProjectJson[], Project[]> {

    constructor() {
        super();
        this.addRequestPathElements('list');
    }

    getParams(): Object {
        return {};
    }

    protected processResponse(response: JsonResponse<ProjectJson[]>): Project[] {
        return response.getResult()['projects'].map(Project.fromJson).sort(this.sortProjects);
    }

    private sortProjects(item1: Project, item2: Project): number {
        if (item1.getName() === Project.DEFAULT_PROJECT_NAME) {
            return -1;
        }

        if (item2.getName() === Project.DEFAULT_PROJECT_NAME) {
            return 1;
        }

        return item1.getName().localeCompare(item2.getName());
    }
}
