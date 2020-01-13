import {ProjectResourceRequest} from './ProjectResourceRequest';
import {ProjectItemJson} from './json/ProjectItemJson';
import {ProjectItem} from '../data/ProjectItem';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class ProjectCreateRequest
    extends ProjectResourceRequest<ProjectItemJson, ProjectItem> {

    private name: string;

    private displayName: string;

    private description: string;

    constructor() {
        super();
        this.setMethod('POST');
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

    getParams(): Object {
        return {
            name: this.name,
            displayName: this.displayName,
            description: this.description
        };
    }

    protected processResponse(response: JsonResponse<ProjectItemJson>): ProjectItem {
        return ProjectItem.fromJson(response.getResult());
    }
}
