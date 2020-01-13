import {ContentResourceRequest} from './ContentResourceRequest';

export abstract class PageResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ContentResourceRequest<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('page');
    }
}
