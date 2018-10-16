import ApplicationKey = api.application.ApplicationKey;
import DescriptorKey = api.content.page.DescriptorKey;
import PartDescriptor = api.content.page.region.PartDescriptor;
import {GetPartDescriptorsByApplicationRequest} from '../../resource/GetPartDescriptorsByApplicationRequest';
import {ApplicationBasedCache} from '../../application/ApplicationBasedCache';

export class PartDescriptorCache
    extends ApplicationBasedCache<PartDescriptor, DescriptorKey> {

    static get(): PartDescriptorCache {

        let w = api.dom.WindowDOM.get();
        let topWindow: any = w.getTopParent() == null ? w.asWindow() : w.getTopParent().asWindow();

        if (!topWindow['PartDescriptorCache']) {
            topWindow['PartDescriptorCache'] = new PartDescriptorCache();
        }
        return topWindow['PartDescriptorCache'];
    }

    loadByApplication(applicationKey: ApplicationKey) {
        new GetPartDescriptorsByApplicationRequest(applicationKey).sendAndParse().catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).done();
    }
}
