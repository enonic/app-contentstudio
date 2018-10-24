import DescriptorKey = api.content.page.DescriptorKey;
import PageDescriptor = api.content.page.PageDescriptor;
import PageDescriptorJson = api.content.page.PageDescriptorJson;
import {PageDescriptorResourceRequest} from './PageDescriptorResourceRequest';
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';
import {GetPageDescriptorsByApplicationRequest} from './GetPageDescriptorsByApplicationRequest';

export class GetPageDescriptorByKeyRequest
    extends PageDescriptorResourceRequest<PageDescriptorJson, PageDescriptor> {

    private key: DescriptorKey;

    private cache: ApplicationBasedCache<PageDescriptor>;

    constructor(key: DescriptorKey) {
        super();
        super.setMethod('GET');
        this.key = key;
        this.cache = ApplicationBasedCache.registerCache<PageDescriptor>(PageDescriptor, GetPageDescriptorsByApplicationRequest);
    }

    getParams(): Object {
        return {
            key: this.key.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return super.getResourcePath();
    }

    sendAndParse(): wemQ.Promise<PageDescriptor> {
        let pageDescriptor = this.cache.getByKey(this.key);
        if (pageDescriptor) {
            return wemQ(pageDescriptor);
        } else {
            return this.send().then((response: api.rest.JsonResponse<PageDescriptorJson>) => {
                return PageDescriptor.fromJson(response.getResult());
            });
        }
    }
}
