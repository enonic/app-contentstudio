import {CmsContentResourceRequest} from '../app/resource/CmsContentResourceRequest';

export abstract class FragmentResourceRequest<PARSED_TYPE>
    extends CmsContentResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('page', 'fragment');
    }

}
