import {ProjectResourceRequest} from './ProjectResourceRequest';
import {ProjectItemJson} from './json/ProjectItemJson';
import {ProjectItem} from '../ProjectItem';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class ProjectCreateRequest
    extends ProjectResourceRequest<ProjectItemJson, ProjectItem> {

    private name: string;

    private displayName: string;

    private description: string;

    constructor() {
        super();
        this.setMethod('POST');
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'create');
    }

    getParams(): Object {
        return {
            name: this.name,
            displayName: this.displayName,
            description: this.description
        };
    }

    sendAndParse(): Q.Promise<ProjectItem> {
        return this.send().then((response: JsonResponse<ProjectItemJson>) => {
            return ProjectItem.fromJson(response.getResult());
        });
    }
}
