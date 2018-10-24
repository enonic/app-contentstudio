import {JsonResourceRequest} from '../app/resource/JsonResourceRequest';

export class FragmentResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: api.rest.Path;

    constructor() {
        super();
        this.resourcePath = api.rest.Path.fromParent(super.getRestPath(), 'content', 'page', 'fragment');
    }

    getResourcePath(): api.rest.Path {
        return this.resourcePath;
    }
}
