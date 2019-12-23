import {ProjectResourceRequest} from './ProjectResourceRequest';
import {ProjectItem} from '../ProjectItem';
import {ProjectItemJson} from './json/ProjectItemJson';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class ProjectListRequest
    extends ProjectResourceRequest<ProjectItemJson[], ProjectItem[]> {

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'list');
    }

    sendAndParse(): Q.Promise<ProjectItem[]> {

        return this.send().then((response: JsonResponse<ProjectItemJson[]>) => {
            return response.getResult().map(ProjectItem.fromJson);
        });
    }

}
