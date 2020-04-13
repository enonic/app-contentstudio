import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';
import {ProjectBasedResourceRequest} from '../wizard/ProjectBasedResourceRequest';

export abstract class XDataResourceRequest<PARSED_TYPE>
    extends ProjectBasedResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('schema', 'xdata');
    }

    fromJsonToXData(json: XDataJson) {
        return XData.fromJson(json);
    }
}
