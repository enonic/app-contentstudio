import ApplicationKey = api.application.ApplicationKey;
import PageDescriptor = api.content.page.PageDescriptor;
import DescriptorKey = api.content.page.DescriptorKey;
import {GetPageDescriptorsByApplicationRequest} from '../resource/GetPageDescriptorsByApplicationRequest';
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';

export class PageDescriptorCache
    extends ApplicationBasedCache<PageDescriptor, DescriptorKey> {

    static get(): PageDescriptorCache {

        let w = api.dom.WindowDOM.get();
        let topWindow: any = w.getTopParent() == null ? w.asWindow() : w.getTopParent().asWindow();

        if (!topWindow['PageDescriptorCache']) {
            topWindow['PageDescriptorCache'] = new PageDescriptorCache();
        }
        return topWindow['PageDescriptorCache'];
    }

    protected loadByApplication(applicationKey: ApplicationKey) {
        new GetPageDescriptorsByApplicationRequest(applicationKey).sendAndParse().catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).done();
    }
}
