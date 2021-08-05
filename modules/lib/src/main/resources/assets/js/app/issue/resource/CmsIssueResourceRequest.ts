import {CmsProjectBasedResourceRequest} from '../../wizard/CmsProjectBasedResourceRequest';

export abstract class CmsIssueResourceRequest<PARSED_TYPE>
    extends CmsProjectBasedResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('issue');
    }

}
