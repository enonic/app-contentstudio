import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {UrlHelper} from '../util/UrlHelper';

export abstract class TaskResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('tasks');
    }

    getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }
}
