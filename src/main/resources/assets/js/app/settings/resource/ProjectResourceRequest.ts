import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';

export abstract class ProjectResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('project');
    }

}
