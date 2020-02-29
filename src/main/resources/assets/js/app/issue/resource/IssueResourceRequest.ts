import {ProjectBasedResourceRequest} from '../../wizard/ProjectBasedResourceRequest';

export abstract class IssueResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ProjectBasedResourceRequest<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('issue');
    }

}
