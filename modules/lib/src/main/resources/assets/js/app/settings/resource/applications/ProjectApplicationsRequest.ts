import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {ProjectApplication} from '../../wizard/panel/form/element/ProjectApplication';
import {ProjectApplicationJson} from '../json/applications/ProjectApplicationJson';

export class ProjectApplicationsRequest
    extends ResourceRequest<ProjectApplication[]> {

    getRequestPath(): Path {
        return Path.fromString(CONFIG.getString('services.appServiceUrl'));
    }

    protected parseResponse(response: JsonResponse<ProjectApplicationJson[]>): ProjectApplication[] {
        return ProjectApplication.fromJsonArray(response.getResult());
    }
}
