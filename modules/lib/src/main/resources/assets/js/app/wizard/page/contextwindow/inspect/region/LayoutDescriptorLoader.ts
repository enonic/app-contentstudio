import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {GetLayoutDescriptorsRequest} from './GetLayoutDescriptorsRequest';
import {ComponentDescriptorLoader} from './ComponentDescriptorLoader';

export class LayoutDescriptorLoader
    extends ComponentDescriptorLoader<LayoutDescriptor> {

    protected createRequest(): GetLayoutDescriptorsRequest {
        return new GetLayoutDescriptorsRequest();
    }
}
