import ApplicationKey = api.application.ApplicationKey;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import LayoutDescriptorsJson = api.content.page.region.LayoutDescriptorsJson;
import {GetLayoutDescriptorsByApplicationRequest} from '../../../../../resource/GetLayoutDescriptorsByApplicationRequest';
import {GetComponentDescriptorsByApplicationsRequest} from './GetComponentDescriptorsByApplicationsRequest';

export class GetLayoutDescriptorsByApplicationsRequest
    extends GetComponentDescriptorsByApplicationsRequest<LayoutDescriptorsJson, LayoutDescriptor> {

    protected createGetDescriptorsByApplicationRequest(applicationKey: ApplicationKey): GetLayoutDescriptorsByApplicationRequest {
        return new GetLayoutDescriptorsByApplicationRequest(applicationKey);
    }
}
