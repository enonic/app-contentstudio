/*
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {DescriptorByDisplayNameComparator} from '../DescriptorByDisplayNameComparator';
import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';
import {GetPageDescriptorsRequest} from './GetPageDescriptorsRequest';
import {ContentId} from 'lib-admin-ui/content/ContentId';

export class PageDescriptorLoader
    extends BaseLoader<PageDescriptor> {

    protected request: GetPageDescriptorsRequest;

    constructor() {
        super();

        this.setComparator(new DescriptorByDisplayNameComparator());
    }

    filterFn(descriptor: PageDescriptor) {
        return descriptor.getDisplayName().toString().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

    protected createRequest(): GetPageDescriptorsRequest {
        return new GetPageDescriptorsRequest();
    }

    setContentId(contentId: ContentId) {
        this.request.setContentId(contentId);
    }
}
*/
