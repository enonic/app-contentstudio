import {ListApplicationsRequest} from '@enonic/lib-admin-ui/application/ListApplicationsRequest';
import {UrlHelper} from '../util/UrlHelper';

export class ListSiteApplicationsRequest
    extends ListApplicationsRequest {

    getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }

    constructor() {
        super('getSiteApplications');
    }

}
