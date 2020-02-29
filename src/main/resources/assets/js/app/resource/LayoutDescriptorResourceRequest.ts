import {ResourceRequestAdvanced} from '../wizard/ResourceRequestAdvanced';

export abstract class LayoutDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequestAdvanced<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('content', 'page', 'layout', 'descriptor');
    }
}
