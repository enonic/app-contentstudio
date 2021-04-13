import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {GetPartDescriptorsRequest} from './GetPartDescriptorsRequest';
import {ComponentDescriptorLoader} from './ComponentDescriptorLoader';

export class PartDescriptorLoader
    extends ComponentDescriptorLoader<PartDescriptor> {

    protected createRequest(): GetPartDescriptorsRequest {
        return new GetPartDescriptorsRequest();
    }

}
