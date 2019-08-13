import {JsonResourceRequest} from '../app/resource/JsonResourceRequest';

export class FragmentResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    getResourcePath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'page', 'fragment');
    }
}
