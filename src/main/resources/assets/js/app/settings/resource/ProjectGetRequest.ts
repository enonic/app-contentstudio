import {ProjectResourceRequest} from './ProjectResourceRequest';
import {ProjectItemJson} from './json/ProjectItemJson';
import {ProjectItem} from '../data/ProjectItem';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class ProjectGetRequest
    extends ProjectResourceRequest<ProjectItemJson, ProjectItem> {

    private name: string;

    constructor(name: string) {
        super();

        this.name = name;
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'get');
    }

    getParams(): Object {
        return {
            name: this.name
        };
    }

    sendAndParse(): Q.Promise<ProjectItem> {
        return this.send().then((response: JsonResponse<ProjectItemJson>) => {
            return ProjectItem.fromJson(response.getResult());
        });
    }
}
