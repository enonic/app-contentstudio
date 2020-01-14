import {ResourceRequestAdvanced} from '../../wizard/ResourceRequestAdvanced';

export abstract class IssueResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequestAdvanced<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('issue');
    }

}
