import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';
import {CmsResourceRequest} from './CmsResourceRequest';

export abstract class XDataResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('schema', 'xdata');
    }

    fromJsonToXData(json: XDataJson) {
        return XData.fromJson(json);
    }
}
