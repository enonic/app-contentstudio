import PartDescriptorsJson = api.content.page.region.PartDescriptorsJson;
import PartDescriptor = api.content.page.region.PartDescriptor;
import {GetPartDescriptorsByApplicationsRequest} from './GetPartDescriptorsByApplicationsRequest';
import {ComponentDescriptorLoader} from './ComponentDescriptorLoader';

export class PartDescriptorLoader
    extends ComponentDescriptorLoader<PartDescriptorsJson, PartDescriptor> {

    protected createRequest(): GetPartDescriptorsByApplicationsRequest {
        return new GetPartDescriptorsByApplicationsRequest();
    }

}
