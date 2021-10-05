import {CmsResourceRequest} from './CmsResourceRequest';
import {ContentResourceRequest} from './ContentResourceRequest';

export abstract class PageDescriptorResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements(ContentResourceRequest.CONTENT_PATH, 'page', 'descriptor');
    }

}
