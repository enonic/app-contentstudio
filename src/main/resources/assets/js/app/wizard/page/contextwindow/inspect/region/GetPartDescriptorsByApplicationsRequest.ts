import ApplicationKey = api.application.ApplicationKey;
import PartDescriptor = api.content.page.region.PartDescriptor;
import PartDescriptorsJson = api.content.page.region.PartDescriptorsJson;
import {GetPartDescriptorsByApplicationRequest} from '../../../../../resource/GetPartDescriptorsByApplicationRequest';
import {GetComponentDescriptorsByApplicationsRequest} from './GetComponentDescriptorsByApplicationsRequest';

export class GetPartDescriptorsByApplicationsRequest
    extends GetComponentDescriptorsByApplicationsRequest<PartDescriptorsJson, PartDescriptor> {

    protected createGetDescriptorsByApplicationRequest(applicationKey: ApplicationKey): GetPartDescriptorsByApplicationRequest {
        return new GetPartDescriptorsByApplicationRequest(applicationKey);
    }
}
