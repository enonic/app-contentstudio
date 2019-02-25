import LayoutDescriptorsJson = api.content.page.region.LayoutDescriptorsJson;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import {GetLayoutDescriptorsByApplicationsRequest} from './GetLayoutDescriptorsByApplicationsRequest';
import {ComponentDescriptorLoader} from './ComponentDescriptorLoader';

export class LayoutDescriptorLoader
    extends ComponentDescriptorLoader<LayoutDescriptorsJson, LayoutDescriptor> {

    protected createRequest(): GetLayoutDescriptorsByApplicationsRequest {
        return new GetLayoutDescriptorsByApplicationsRequest();
    }
}
