import {Path} from 'lib-admin-ui/rest/Path';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';

export class XDataResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {
    private resourceUrl: Path;

    constructor() {
        super();
        this.resourceUrl = Path.fromParent(super.getRestPath(), 'schema/xdata');
    }

    getResourcePath(): Path {
        return this.resourceUrl;
    }

    fromJsonToXData(json: XDataJson) {
        return XData.fromJson(json);
    }
}
