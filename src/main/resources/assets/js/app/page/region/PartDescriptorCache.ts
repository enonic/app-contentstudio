import ApplicationKey = api.application.ApplicationKey;
import ApplicationBasedCache = api.application.ApplicationBasedCache;
import DescriptorKey = api.content.page.DescriptorKey;
import PartDescriptor = api.content.page.region.PartDescriptor;
import {GetPartDescriptorsByApplicationRequest} from '../../resource/GetPartDescriptorsByApplicationRequest';

export class PartDescriptorCache
    extends ApplicationBasedCache<PartDescriptorApplicationCache, PartDescriptor, DescriptorKey> {

    private static instance: PartDescriptorCache;

    static get(): PartDescriptorCache {

        let w = api.dom.WindowDOM.get();
        let topWindow: any = w.getTopParent() == null ? w.asWindow() : w.getTopParent().asWindow();

        if (!topWindow['PartDescriptorCache']) {
            topWindow['PartDescriptorCache'] = new PartDescriptorCache();
        }
        return topWindow['PartDescriptorCache'];
    }

    constructor() {
        if (PartDescriptorCache.instance) {
            throw new Error('Instantiation failed: Use PartDescriptorCache.get() instead!');
        }
        super();
    }

    loadByApplication(applicationKey: ApplicationKey) {
        new GetPartDescriptorsByApplicationRequest(applicationKey).sendAndParse().catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).done();
    }

    put(descriptor: PartDescriptor) {
        api.util.assertNotNull(descriptor, 'a PartDescriptor must be given');

        super.put(descriptor, descriptor.getKey().getApplicationKey());
    }

    getByKey(key: DescriptorKey): PartDescriptor {
        return super.getByKey(key, key.getApplicationKey());
    }

    createApplicationCache(): PartDescriptorApplicationCache {
        return new PartDescriptorApplicationCache();
    }
}

export class PartDescriptorApplicationCache
    extends api.cache.Cache<PartDescriptor, DescriptorKey> {

    copy(object: PartDescriptor): PartDescriptor {
        return object.clone();
    }

    getKeyFromObject(object: PartDescriptor): DescriptorKey {
        return object.getKey();
    }

    getKeyAsString(key: DescriptorKey): string {
        return key.toString();
    }
}
