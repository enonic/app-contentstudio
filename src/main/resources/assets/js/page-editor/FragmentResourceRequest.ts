import {JsonResourceRequest} from '../app/resource/JsonResourceRequest';
import {Path} from 'lib-admin-ui/rest/Path';

export class FragmentResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'content', 'page', 'fragment');
    }

    getResourcePath(): Path {
        return this.resourcePath;
    }
}
