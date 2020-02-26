import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {Path} from 'lib-admin-ui/rest/Path';

export class PageDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'content', 'page', 'descriptor');
    }

    getResourcePath(): Path {
        return this.resourcePath;
    }
}
