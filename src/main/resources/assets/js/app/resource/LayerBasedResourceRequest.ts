import Path = api.rest.Path;
import {LayerBasedRestPath} from './LayerBasedRestPath';

export class LayerBasedResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends api.rest.ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    getResourcePath(): Path {
        return LayerBasedRestPath.get().getRestPath();
    }
}
