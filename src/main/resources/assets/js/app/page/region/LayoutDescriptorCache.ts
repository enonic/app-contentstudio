import ApplicationKey = api.application.ApplicationKey;
import ApplicationBasedCache = api.application.ApplicationBasedCache;
import DescriptorKey = api.content.page.DescriptorKey;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import {GetLayoutDescriptorsByApplicationRequest} from '../../resource/GetLayoutDescriptorsByApplicationRequest';

export class LayoutDescriptorCache
    extends ApplicationBasedCache<LayoutDescriptorApplicationCache, LayoutDescriptor, DescriptorKey> {

    private static instance: LayoutDescriptorCache;

    static get(): LayoutDescriptorCache {

        let w = api.dom.WindowDOM.get();
        let topWindow: any = w.getTopParent() == null ? w.asWindow() : w.getTopParent().asWindow();

        if (!topWindow['LayoutDescriptorCache']) {
            topWindow['LayoutDescriptorCache'] = new LayoutDescriptorCache();
        }
        return topWindow['LayoutDescriptorCache'];
    }

    constructor() {
        if (LayoutDescriptorCache.instance) {
            throw new Error('Instantiation failed: Use LayoutDescriptorCache.get() instead!');
        }
        super();
    }

    protected loadByApplication(applicationKey: ApplicationKey) {
        new GetLayoutDescriptorsByApplicationRequest(applicationKey).sendAndParse().catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).done();
    }

    put(descriptor: LayoutDescriptor) {
        api.util.assertNotNull(descriptor, 'a LayoutDescriptor must be given');

        super.put(descriptor, descriptor.getKey().getApplicationKey());
    }

    getByKey(key: DescriptorKey): LayoutDescriptor {
        return super.getByKey(key, key.getApplicationKey());
    }

    createApplicationCache(): LayoutDescriptorApplicationCache {
        return new LayoutDescriptorApplicationCache();
    }
}

export class LayoutDescriptorApplicationCache
    extends api.cache.Cache<LayoutDescriptor, DescriptorKey> {

    copy(object: LayoutDescriptor): LayoutDescriptor {
        return object.clone();
    }

    getKeyFromObject(object: LayoutDescriptor): DescriptorKey {
        return object.getKey();
    }

    getKeyAsString(key: DescriptorKey): string {
        return key.toString();
    }
}
