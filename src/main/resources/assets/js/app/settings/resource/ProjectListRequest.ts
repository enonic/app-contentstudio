import {ProjectResourceRequest} from './ProjectResourceRequest';
import {ProjectItem} from '../data/ProjectItem';
import {ProjectItemJson} from './json/ProjectItemJson';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class ProjectListRequest
    extends ProjectResourceRequest<ProjectItemJson[], ProjectItem[]> {

    constructor() {
        super();
        this.addRequestPathElements('list');
    }

    getParams(): Object {
        return {};
    }

    protected processResponse(response: JsonResponse<ProjectItemJson[]>): ProjectItem[] {
        return response.getResult()['projects'].map(ProjectItem.fromJson).sort(this.sortProjects);
    }

    private sortProjects(item1: ProjectItem, item2: ProjectItem): number {
        if (item1.getId() === ProjectItem.DEFAULT) {
            return -1;
        }

        if (item2.getId() === ProjectItem.DEFAULT) {
            return 1;
        }

        return item1.getId().localeCompare(item2.getId());
    }
}
