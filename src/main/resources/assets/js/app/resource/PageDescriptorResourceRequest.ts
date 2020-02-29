import {ResourceRequestAdvanced} from '../wizard/ResourceRequestAdvanced';

export abstract class PageDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequestAdvanced<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('content', 'page', 'descriptor');
    }

}
