import {Path} from 'lib-admin-ui/rest/Path';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';

export class PartDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'content', 'page', 'part', 'descriptor');
    }

    getResourcePath(): Path {
        return this.resourcePath;
    }
}
