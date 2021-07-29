import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';
import {CmsProjectBasedResourceRequest} from '../wizard/CmsProjectBasedResourceRequest';

export abstract class XDataResourceRequest<PARSED_TYPE>
    extends CmsProjectBasedResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('schema', 'xdata');
    }

    fromJsonToXData(json: XDataJson) {
        return XData.fromJson(json);
    }
}
