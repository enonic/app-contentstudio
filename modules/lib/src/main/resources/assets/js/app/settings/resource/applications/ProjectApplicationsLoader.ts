import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {ProjectApplicationsRequest} from './ProjectApplicationsRequest';
import {ProjectApplication} from '../../wizard/panel/form/element/ProjectApplication';
import {ProjectApplicationsListRequest} from './ProjectApplicationsListRequest';

export class ProjectApplicationsLoader
    extends BaseLoader<ProjectApplication> {

    constructor() {
        super();
    }

    protected createRequest(): ProjectApplicationsListRequest {
        return new ProjectApplicationsListRequest();
    }
}
