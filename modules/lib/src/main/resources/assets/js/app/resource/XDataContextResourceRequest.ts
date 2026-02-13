import {XData} from '../content/XData';
import {type XDataJson} from './json/XDataJson';
import {CmsProjectBasedResourceRequest} from '../wizard/CmsProjectBasedResourceRequest';
import {ContentPath} from '../content/ContentPath';

export abstract class XDataContextResourceRequest<PARSED_TYPE>
    extends CmsProjectBasedResourceRequest<PARSED_TYPE> {

    protected constructor() {
        super();
        this.addRequestPathElements('schema', 'xdata');
        this.setContentRootPath(ContentPath.CONTENT_ROOT);
    }

    fromJsonToXData(json: XDataJson) {
        return XData.fromJson(json);
    }
}
