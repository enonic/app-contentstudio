import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {GetLayoutDescriptorsByApplicationsRequest} from './GetLayoutDescriptorsByApplicationsRequest';
import {ComponentDescriptorLoader} from './ComponentDescriptorLoader';

export class LayoutDescriptorLoader
    extends ComponentDescriptorLoader<LayoutDescriptor> {

    protected createRequest(): GetLayoutDescriptorsByApplicationsRequest {
        return new GetLayoutDescriptorsByApplicationsRequest();
    }
}
