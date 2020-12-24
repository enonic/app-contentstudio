import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';

export abstract class ProjectResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    public static PROJECT_RESOURCE_PATH: string = 'project';

    constructor() {
        super();
        this.addRequestPathElements(ProjectResourceRequest.PROJECT_RESOURCE_PATH);
    }

}
