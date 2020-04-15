import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';

export abstract class LayoutDescriptorResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('content', 'page', 'layout', 'descriptor');
    }
}
