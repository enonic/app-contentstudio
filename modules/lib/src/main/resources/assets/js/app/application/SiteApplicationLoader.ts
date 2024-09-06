import {ApplicationLoader} from '@enonic/lib-admin-ui/application/ApplicationLoader';
import {ListSiteApplicationsRequest} from '../resource/ListSiteApplicationsRequest';

export class SiteApplicationLoader
    extends ApplicationLoader {

    constructor(filterObject: object) {
        super(filterObject);
    }

    protected createRequest(): ListSiteApplicationsRequest {
        return new ListSiteApplicationsRequest();
    }
}
