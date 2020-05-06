import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';

export abstract class PartDescriptorResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('content', 'page', 'part', 'descriptor');
    }

}
