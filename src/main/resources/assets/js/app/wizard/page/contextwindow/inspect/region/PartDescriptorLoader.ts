import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {GetPartDescriptorsByApplicationsRequest} from './GetPartDescriptorsByApplicationsRequest';
import {ComponentDescriptorLoader} from './ComponentDescriptorLoader';

export class PartDescriptorLoader
    extends ComponentDescriptorLoader<PartDescriptor> {

    protected createRequest(): GetPartDescriptorsByApplicationsRequest {
        return new GetPartDescriptorsByApplicationsRequest();
    }

}
