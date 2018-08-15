import ApplicationKey = api.application.ApplicationKey;
import PageDescriptorsJson = api.content.page.PageDescriptorsJson;
import PageDescriptor = api.content.page.PageDescriptor;
import {GetPageDescriptorsByApplicationsRequest} from './GetPageDescriptorsByApplicationsRequest';
import {DescriptorByDisplayNameComparator} from '../DescriptorByDisplayNameComparator';

export class PageDescriptorLoader
    extends api.util.loader.BaseLoader<PageDescriptorsJson, PageDescriptor> {

    protected request: GetPageDescriptorsByApplicationsRequest;

    constructor() {
        super();

        this.setComparator(new DescriptorByDisplayNameComparator());
    }

    filterFn(descriptor: PageDescriptor) {
        return descriptor.getDisplayName().toString().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

    protected createRequest(): GetPageDescriptorsByApplicationsRequest {
        return new GetPageDescriptorsByApplicationsRequest();
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.request.setApplicationKeys(applicationKeys);
    }

}
