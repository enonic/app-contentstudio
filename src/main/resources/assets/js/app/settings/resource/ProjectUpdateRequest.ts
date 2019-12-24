import {ProjectResourceRequest} from './ProjectResourceRequest';
import {ProjectItemJson} from './json/ProjectItemJson';
import {ProjectItem} from '../data/ProjectItem';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class ProjectUpdateRequest
    extends ProjectResourceRequest<ProjectItemJson, ProjectItem> {

    private name: string;

    private displayName: string;

    private description: string;

    constructor() {
        super();
        this.setMethod('POST');
    }

    setName(value: string): ProjectUpdateRequest {
        this.name = value;
        return this;
    }

    setDisplayName(value: string): ProjectUpdateRequest {
        this.displayName = value;
        return this;
    }

    setDescription(value: string): ProjectUpdateRequest {
        this.description = value;
        return this;
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'modify');
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
