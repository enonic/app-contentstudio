import {type Descriptor} from '../../../../../page/Descriptor';
import {DescriptorByDisplayNameComparator} from '../DescriptorByDisplayNameComparator';
import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {GetComponentDescriptorsRequest} from '../../../../../resource/GetComponentDescriptorsRequest';
import {type ComponentType} from '../../../../../page/region/ComponentType';
import {type ContentId} from '../../../../../content/ContentId';

export class ComponentDescriptorsLoader
    extends BaseLoader<Descriptor> {

    declare protected request: GetComponentDescriptorsRequest;

    constructor() {
        super();

        this.setComparator(new DescriptorByDisplayNameComparator());
    }

    protected createRequest(): GetComponentDescriptorsRequest {
        return new GetComponentDescriptorsRequest();
    }

    setComponentType(componentType: ComponentType) {
        this.request.setComponentType(componentType);
        return this;
    }

    setContentId(contentId: ContentId) {
        this.request.setContentId(contentId);
        return this;
    }

    filterFn(descriptor: Descriptor) {
        return descriptor.getDisplayName().toString().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

}
