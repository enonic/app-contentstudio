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
        return response.getResult()['projects'].map(ProjectItem.fromJson);
    }
}
