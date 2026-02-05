import {MixinDescriptor} from '../content/MixinDescriptor';
import {MixinDescriptorJson} from './json/MixinDescriptorJson';
import {CmsProjectBasedResourceRequest} from '../wizard/CmsProjectBasedResourceRequest';
import {ContentPath} from '../content/ContentPath';

export abstract class XDataContextResourceRequest<PARSED_TYPE>
    extends CmsProjectBasedResourceRequest<PARSED_TYPE> {

    protected constructor() {
        super();
        this.addRequestPathElements('schema', 'mixins');
        this.setContentRootPath(ContentPath.CONTENT_ROOT);
    }

    fromJsonToXData(json: MixinDescriptorJson) {
        return MixinDescriptor.fromJson(json);
    }
}
