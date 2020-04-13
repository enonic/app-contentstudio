import {ContentResourceRequest} from './ContentResourceRequest';

export abstract class PageResourceRequest<PARSED_TYPE>
    extends ContentResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('page');
    }
}
