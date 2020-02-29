import {ResourceRequestAdvanced} from '../../wizard/ResourceRequestAdvanced';

export abstract class ProjectResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequestAdvanced<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('project');
    }

}
