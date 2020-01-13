import {ProjectResourceRequest} from './ProjectResourceRequest';
import {ProjectItemJson} from './json/ProjectItemJson';
import {ProjectItem} from '../data/ProjectItem';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class ProjectGetRequest
    extends ProjectResourceRequest<ProjectItemJson, ProjectItem> {

    private name: string;

    constructor(name: string) {
        super();

        this.name = name;
        this.addRequestPathElements('get');
    }

    getParams(): Object {
        return {
            name: this.name
        };
    }

    protected processResponse(response: JsonResponse<ProjectItemJson>): ProjectItem {
        return ProjectItem.fromJson(response.getResult());
    }
}
