import ApplicationKey = api.application.ApplicationKey;
import LayoutDescriptorsJson = api.content.page.region.LayoutDescriptorsJson;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import {DescriptorByDisplayNameComparator} from '../DescriptorByDisplayNameComparator';
import {GetLayoutDescriptorsByApplicationsRequest} from './GetLayoutDescriptorsByApplicationsRequest';

export class LayoutDescriptorLoader
    extends api.util.loader.BaseLoader<LayoutDescriptorsJson, LayoutDescriptor> {

    protected request: GetLayoutDescriptorsByApplicationsRequest;

    constructor() {
        super();

        this.setComparator(new DescriptorByDisplayNameComparator());
    }

    filterFn(descriptor: LayoutDescriptor) {
        return descriptor.getDisplayName().toString().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

    protected createRequest(): GetLayoutDescriptorsByApplicationsRequest {
        return new GetLayoutDescriptorsByApplicationsRequest();
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.request.setApplicationKeys(applicationKeys);
    }
}
