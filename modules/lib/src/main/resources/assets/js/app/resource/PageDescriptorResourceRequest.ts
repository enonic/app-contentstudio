import {CmsResourceRequest} from './CmsResourceRequest';

export abstract class PageDescriptorResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('content', 'page', 'descriptor');
    }

}
