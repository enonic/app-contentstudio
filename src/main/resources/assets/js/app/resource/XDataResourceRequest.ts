import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';
import {ContentResourceRequest} from './ContentResourceRequest';

export abstract class XDataResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ContentResourceRequest<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('schema', 'xdata');
    }

    fromJsonToXData(json: XDataJson) {
        return XData.fromJson(json);
    }
}
