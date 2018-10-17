import {PageDescriptorResourceRequest} from './PageDescriptorResourceRequest';
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';
import PageDescriptor = api.content.page.PageDescriptor;
import PageDescriptorsJson = api.content.page.PageDescriptorsJson;
import PageDescriptorJson = api.content.page.PageDescriptorJson;

export class GetPageDescriptorsByApplicationRequest
    extends PageDescriptorResourceRequest<PageDescriptorsJson, PageDescriptor[]> {

    private applicationKey: api.application.ApplicationKey;

    private cache: ApplicationBasedCache<PageDescriptor>;

    constructor(applicationKey: api.application.ApplicationKey) {
        super();
        super.setMethod('GET');
        this.applicationKey = applicationKey;
        this.cache = ApplicationBasedCache.registerCache<PageDescriptor>(PageDescriptor, GetPageDescriptorsByApplicationRequest);
    }

    getParams(): Object {
        return {
            applicationKey: this.applicationKey.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'list', 'by_application');
    }

    sendAndParse(): wemQ.Promise<PageDescriptor[]> {
        // In case frame was reloaded in IE it can't use objects from cache
        // as they are from old unreachable for IE frame
        if (!api.BrowserHelper.isIE()) {
            const cached = this.cache.getByApplication(this.applicationKey);
            if (cached) {
                return wemQ(cached);
            }
        }

        return this.send().then((response: api.rest.JsonResponse<PageDescriptorsJson>) => {
            return response.getResult().descriptors.map((descriptorJson: PageDescriptorJson) => {
                const pageDescriptor = api.content.page.PageDescriptor.fromJson(descriptorJson);
                this.cache.put(pageDescriptor);
                return pageDescriptor;
            });
        });
    }
}
