import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';
import {LayerBasedResourceRequest} from './LayerBasedResourceRequest';

export class XDataResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends LayerBasedResourceRequest<JSON_TYPE, PARSED_TYPE> {

    getResourcePath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'schema', 'xdata');
    }

    fromJsonToXData(json: XDataJson) {
        return XData.fromJson(json);
    }
}
