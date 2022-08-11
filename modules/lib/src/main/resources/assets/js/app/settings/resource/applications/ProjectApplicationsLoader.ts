import {Application} from '@enonic/lib-admin-ui/application/Application';
import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {ProjectApplicationsRequest} from './ProjectApplicationsRequest';

export class ProjectApplicationsLoader
    extends BaseLoader<Application> {

    constructor() {
        super();
    }

    protected createRequest(): ProjectApplicationsRequest {
        return new ProjectApplicationsRequest();
    }
}
