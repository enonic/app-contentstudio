import * as Q from 'q';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {PageDescriptorsJson} from 'lib-admin-ui/content/page/PageDescriptorsJson';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {PageDescriptorResourceRequest} from '../../../../../resource/PageDescriptorResourceRequest';
import {ApplicationBasedCache} from '../../../../../application/ApplicationBasedCache';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class GetPageDescriptorsByApplicationsRequest
    extends PageDescriptorResourceRequest<PageDescriptor[]> {

    private applicationKeys: ApplicationKey[];

    private cache: ApplicationBasedCache<PageDescriptor>;

    constructor(applicationKeys?: ApplicationKey[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.applicationKeys = applicationKeys;
        this.cache = ApplicationBasedCache.registerCache<PageDescriptor>(PageDescriptor, GetPageDescriptorsByApplicationsRequest);
        this.addRequestPathElements('list', 'by_applications');
    }

    getParams(): Object {
        return {
            applicationKeys: this.applicationKeys ? this.applicationKeys.map(key => key.toString()) : []
        };
    }

    setApplicationKeys(keys: ApplicationKey[]): GetPageDescriptorsByApplicationsRequest {
        this.applicationKeys = keys;
        return this;
    }

    sendAndParse(): Q.Promise<PageDescriptor[]> {
        const cached: PageDescriptor[] = this.cache.getByApplications(this.applicationKeys);
        if (cached) {
            return Q(cached);
        }

        return super.sendAndParse();
    }

    protected parseResponse(response: JsonResponse<PageDescriptorsJson>): PageDescriptor[] {
        this.cache.putApplicationKeys(this.applicationKeys);
        return response.getResult().descriptors.map((descJson) => {
            const desc = PageDescriptor.fromJson(descJson);
            this.cache.put(desc);
            return desc;
        });
    }
}
