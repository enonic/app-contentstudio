import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export abstract class PageResourceRequest<PARSED_TYPE>
    extends CmsContentResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('page');
    }
}
