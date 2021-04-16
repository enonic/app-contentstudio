import {Descriptor} from '../../../../../page/Descriptor';
import {DescriptorByDisplayNameComparator} from '../DescriptorByDisplayNameComparator';
import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {GetComponentDescriptorsRequest} from '../../../../../resource/GetComponentDescriptorsRequest';
import {ComponentType} from '../../../../../page/region/ComponentType';

export class ComponentDescriptorsLoader
    extends BaseLoader<Descriptor> {

    protected request: GetComponentDescriptorsRequest;
    private readonly componentType: ComponentType;

    constructor(componentType?: ComponentType) {
        super();

        this.componentType = componentType;
        this.setComparator(new DescriptorByDisplayNameComparator());
    }

    protected createRequest(): GetComponentDescriptorsRequest {
        return new GetComponentDescriptorsRequest(this.componentType);
    }

    setContentId(contentId: ContentId) {
        this.request.setContentId(contentId);
        return this;
    }

    filterFn(descriptor: Descriptor) {
        return descriptor.getDisplayName().toString().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

}
