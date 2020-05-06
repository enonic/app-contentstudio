import * as Q from 'q';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {PageDescriptorJson} from 'lib-admin-ui/content/page/PageDescriptorJson';
import {PageDescriptorResourceRequest} from './PageDescriptorResourceRequest';
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';
import {GetPageDescriptorsByApplicationRequest} from './GetPageDescriptorsByApplicationRequest';

export class GetPageDescriptorByKeyRequest
    extends PageDescriptorResourceRequest<PageDescriptor> {

    private key: DescriptorKey;

    private cache: ApplicationBasedCache<PageDescriptor>;

    constructor(key: DescriptorKey) {
        super();
        this.key = key;
        this.cache = ApplicationBasedCache.registerCache<PageDescriptor>(PageDescriptor, GetPageDescriptorsByApplicationRequest);
    }

    getParams(): Object {
        return {
            key: this.key.toString()
        };
    }

    sendAndParse(): Q.Promise<PageDescriptor> {
        const pageDescriptor: PageDescriptor = this.cache.getByKey(this.key);
        if (pageDescriptor) {
            return Q(pageDescriptor);
        }

        return super.sendAndParse();
    }

    protected parseResponse(response: JsonResponse<PageDescriptorJson>): PageDescriptor {
        return PageDescriptor.fromJson(response.getResult());
    }
}
