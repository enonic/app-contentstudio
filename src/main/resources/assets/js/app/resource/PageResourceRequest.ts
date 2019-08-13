import {JsonResourceRequest} from './JsonResourceRequest';

export class PageResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    getResourcePath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'page');
    }
}
