import {ContentResourceRequest} from '../app/resource/ContentResourceRequest';

export abstract class FragmentResourceRequest<PARSED_TYPE>
    extends ContentResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('page', 'fragment');
    }

}
