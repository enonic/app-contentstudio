import ApplicationKey = api.application.ApplicationKey;
import PartDescriptorsJson = api.content.page.region.PartDescriptorsJson;
import PartDescriptor = api.content.page.region.PartDescriptor;
import {DescriptorByDisplayNameComparator} from '../DescriptorByDisplayNameComparator';
import {GetPartDescriptorsByApplicationsRequest} from './GetPartDescriptorsByApplicationsRequest';

export class PartDescriptorLoader
    extends api.util.loader.BaseLoader<PartDescriptorsJson, PartDescriptor> {

    protected request: GetPartDescriptorsByApplicationsRequest;

    constructor() {
        super();

        this.setComparator(new DescriptorByDisplayNameComparator());
    }

    filterFn(descriptor: PartDescriptor) {
        return descriptor.getDisplayName().toString().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

    protected createRequest(): GetPartDescriptorsByApplicationsRequest {
        return new GetPartDescriptorsByApplicationsRequest();
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.request.setApplicationKeys(applicationKeys);
    }

}
