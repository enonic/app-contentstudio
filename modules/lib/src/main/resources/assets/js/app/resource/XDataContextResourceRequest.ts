import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';
import {CmsProjectBasedResourceRequest} from '../wizard/CmsProjectBasedResourceRequest';

export abstract class XDataContextResourceRequest<PARSED_TYPE>
    extends CmsProjectBasedResourceRequest<PARSED_TYPE> {

    protected constructor() {
        super();
        this.addRequestPathElements('schema', 'xdata');
        this.setContentRootPath('content');
    }

    fromJsonToXData(json: XDataJson) {
        return XData.fromJson(json);
    }
}
