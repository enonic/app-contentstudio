import * as Q from 'q';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageDescriptorResourceRequest} from './PageDescriptorResourceRequest';
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {PageDescriptorsJson} from 'lib-admin-ui/content/page/PageDescriptorsJson';
import {PageDescriptorJson} from 'lib-admin-ui/content/page/PageDescriptorJson';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';

export class GetPageDescriptorsByApplicationRequest
    extends PageDescriptorResourceRequest<PageDescriptor[]> {

    private applicationKey: ApplicationKey;

    private cache: ApplicationBasedCache<PageDescriptor>;

    constructor(applicationKey: ApplicationKey) {
        super();
        this.applicationKey = applicationKey;
        this.cache = ApplicationBasedCache.registerCache<PageDescriptor>(PageDescriptor, GetPageDescriptorsByApplicationRequest);
        this.addRequestPathElements('list', 'by_application');
    }

    getParams(): Object {
        return {
            applicationKey: this.applicationKey.toString()
        };
    }

    sendAndParse(): Q.Promise<PageDescriptor[]> {
        const cached: PageDescriptor[] = this.cache.getByApplications([this.applicationKey]);
        if (cached) {
            return Q(cached);
        }

        return super.sendAndParse();
    }

    protected parseResponse(response: JsonResponse<PageDescriptorsJson>): PageDescriptor[] {
        this.cache.putApplicationKeys([this.applicationKey]);
        return response.getResult().descriptors.map((descriptorJson: PageDescriptorJson) => {
            const pageDescriptor = PageDescriptor.fromJson(descriptorJson);
            this.cache.put(pageDescriptor);
            return pageDescriptor;
        });
    }
}
