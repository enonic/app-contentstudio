import {CmsResourceRequest} from '../../resource/CmsResourceRequest';

export abstract class ProjectResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    public static PROJECT_RESOURCE_PATH: string = 'project';

    constructor() {
        super();
        this.addRequestPathElements(ProjectResourceRequest.PROJECT_RESOURCE_PATH);
    }

}
