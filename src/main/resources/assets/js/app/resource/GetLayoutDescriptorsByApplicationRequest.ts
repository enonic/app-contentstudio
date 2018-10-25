import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import LayoutDescriptorsJson = api.content.page.region.LayoutDescriptorsJson;
import LayoutDescriptorJson = api.content.page.region.LayoutDescriptorJson;
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';
import {LayoutDescriptorResourceRequest} from './LayoutDescriptorResourceRequest';

export class GetLayoutDescriptorsByApplicationRequest
    extends LayoutDescriptorResourceRequest<LayoutDescriptorsJson, LayoutDescriptor[]> {

    private applicationKey: api.application.ApplicationKey;

    private cache: ApplicationBasedCache<LayoutDescriptor>;

    constructor(applicationKey: api.application.ApplicationKey) {
        super();
        super.setMethod('GET');
        this.applicationKey = applicationKey;
        this.cache = ApplicationBasedCache.registerCache<LayoutDescriptor>(LayoutDescriptor, GetLayoutDescriptorsByApplicationRequest);
    }

    getParams(): Object {
        return {
            applicationKey: this.applicationKey.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'list', 'by_application');
    }

    sendAndParse(): wemQ.Promise<LayoutDescriptor[]> {

        let cached = this.cache.getByApplication(this.applicationKey);
        if (cached) {
            return wemQ(cached);
        } else {
            return this.send().then((response: api.rest.JsonResponse<LayoutDescriptorsJson>) => {
                return response.getResult().descriptors.map((descriptorJson: LayoutDescriptorJson) => {
                    const descriptor = LayoutDescriptor.fromJson(descriptorJson);
                    this.cache.put(descriptor);
                    return descriptor;
                });
            });
        }
    }
}
