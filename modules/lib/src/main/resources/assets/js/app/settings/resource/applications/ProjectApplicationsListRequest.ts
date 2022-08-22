import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ProjectApplication} from '../../wizard/panel/form/element/ProjectApplication';
import {ProjectApplicationJson} from '../json/applications/ProjectApplicationJson';
import {ProjectApplicationsRequest} from './ProjectApplicationsRequest';

export class ProjectApplicationsListRequest
    extends ProjectApplicationsRequest<ProjectApplication[]> {

    getOperationType(): string {
        return 'list';
    }

    protected parseResponse(response: JsonResponse<ProjectApplicationJson[]>): ProjectApplication[] {
        return ProjectApplication
            .fromJsonArray(response.getResult())
            .sort((app1: ProjectApplication, app2: ProjectApplication) =>
                app1.getDisplayName() > app2.getDisplayName() ? 1 : -1
            );
    }
}
