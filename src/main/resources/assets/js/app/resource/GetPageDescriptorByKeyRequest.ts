import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {PageDescriptorJson} from 'lib-admin-ui/content/page/PageDescriptorJson';
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

    getRequestPath(): Path {
        return super.getResourcePath();
    }

    sendAndParse(): Q.Promise<PageDescriptor> {
        let pageDescriptor = this.cache.getByKey(this.key);
        if (pageDescriptor) {
            return Q(pageDescriptor);
        } else {
            return this.send().then((response: JsonResponse<PageDescriptorJson>) => {
                return PageDescriptor.fromJson(response.getResult());
            });
        }
    }
}
