import ApplicationKey = api.application.ApplicationKey;
import DescriptorKey = api.content.page.DescriptorKey;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import {GetLayoutDescriptorsByApplicationRequest} from '../../resource/GetLayoutDescriptorsByApplicationRequest';
import {ApplicationBasedCache} from '../../application/ApplicationBasedCache';

export class LayoutDescriptorCache
    extends ApplicationBasedCache<LayoutDescriptor, DescriptorKey> {

    static get(): LayoutDescriptorCache {

        let w = api.dom.WindowDOM.get();
        let topWindow: any = w.getTopParent() == null ? w.asWindow() : w.getTopParent().asWindow();

        if (!topWindow['LayoutDescriptorCache']) {
            topWindow['LayoutDescriptorCache'] = new LayoutDescriptorCache();
        }
        return topWindow['LayoutDescriptorCache'];
    }

    protected loadByApplication(applicationKey: ApplicationKey) {
        new GetLayoutDescriptorsByApplicationRequest(applicationKey).sendAndParse().catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).done();
    }
}
