import {JsonResourceRequest} from './JsonResourceRequest';

export class PageResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: api.rest.Path;

    constructor() {
        super();
        this.resourcePath = api.rest.Path.fromParent(super.getRestPath(), 'content', 'page');
    }

    getResourcePath(): api.rest.Path {
        return this.resourcePath;
    }
}
