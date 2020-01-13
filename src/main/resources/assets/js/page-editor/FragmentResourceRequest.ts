import {ContentResourceRequest} from '../app/resource/ContentResourceRequest';

export abstract class FragmentResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ContentResourceRequest<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('page', 'fragment');
    }

}
