import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {DescriptorByDisplayNameComparator} from '../DescriptorByDisplayNameComparator';
import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {SchemaFilterResourceRequest} from '../../../../../resource/SchemaFilterResourceRequest';

export abstract class ComponentDescriptorLoader<DESCRIPTOR extends Descriptor>
    extends BaseLoader<DESCRIPTOR> {

    protected request: SchemaFilterResourceRequest<DESCRIPTOR[]>;

    constructor() {
        super();

        this.setComparator(new DescriptorByDisplayNameComparator());
    }

    setContentId(contentId: ContentId) {
        this.request.setContentId(contentId);
    }

    filterFn(descriptor: Descriptor) {
        return descriptor.getDisplayName().toString().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

}
