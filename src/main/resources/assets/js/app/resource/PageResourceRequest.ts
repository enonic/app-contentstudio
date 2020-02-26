import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResourceRequest} from './JsonResourceRequest';

export class PageResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'content', 'page');
    }

    getResourcePath(): Path {
        return this.resourcePath;
    }
}
