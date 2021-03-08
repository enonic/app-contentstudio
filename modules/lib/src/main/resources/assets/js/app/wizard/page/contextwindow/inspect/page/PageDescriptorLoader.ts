import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {GetPageDescriptorsByApplicationsRequest} from './GetPageDescriptorsByApplicationsRequest';
import {DescriptorByDisplayNameComparator} from '../DescriptorByDisplayNameComparator';
import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';

export class PageDescriptorLoader
    extends BaseLoader<PageDescriptor> {

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
