import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';

export class XDataResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends api.rest.ResourceRequest<JSON_TYPE, PARSED_TYPE> {
    private resourceUrl: api.rest.Path;

    constructor() {
        super();
        this.resourceUrl = api.rest.Path.fromParent(super.getRestPath(), 'schema/xdata');
    }

    getResourcePath(): api.rest.Path {
        return this.resourceUrl;
    }

    fromJsonToXData(json: XDataJson) {
        return XData.fromJson(json);
    }
}
