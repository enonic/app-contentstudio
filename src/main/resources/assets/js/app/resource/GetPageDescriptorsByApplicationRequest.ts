import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageDescriptorResourceRequest} from './PageDescriptorResourceRequest';
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {PageDescriptorsJson} from 'lib-admin-ui/content/page/PageDescriptorsJson';
import {PageDescriptorJson} from 'lib-admin-ui/content/page/PageDescriptorJson';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';

export class GetPageDescriptorsByApplicationRequest
    extends PageDescriptorResourceRequest<PageDescriptorsJson, PageDescriptor[]> {

    private applicationKey: ApplicationKey;

    private cache: ApplicationBasedCache<PageDescriptor>;

    constructor(applicationKey: ApplicationKey) {
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'list', 'by_application');
    }

    sendAndParse(): Q.Promise<PageDescriptor[]> {
        const cached = this.cache.getByApplications([this.applicationKey]);
        if (cached) {
            return Q(cached);
        }

        return this.send().then((response: JsonResponse<PageDescriptorsJson>) => {
            this.cache.putApplicationKeys([this.applicationKey]);
            return response.getResult().descriptors.map((descriptorJson: PageDescriptorJson) => {
                const pageDescriptor = PageDescriptor.fromJson(descriptorJson);
                this.cache.put(pageDescriptor);
                return pageDescriptor;
            });
        });
    }
}
