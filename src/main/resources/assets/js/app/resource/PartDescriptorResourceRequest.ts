import {ResourceRequestAdvanced} from '../wizard/ResourceRequestAdvanced';

export abstract class PartDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequestAdvanced<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('content', 'page', 'part', 'descriptor');
    }

}
