import {ProjectBasedResourceRequest} from '../../wizard/ProjectBasedResourceRequest';

export abstract class IssueResourceRequest<PARSED_TYPE>
    extends ProjectBasedResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('issue');
    }

}
