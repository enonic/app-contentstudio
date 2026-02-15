import Q from 'q';
import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {PageDescriptorResourceRequest} from '../../../../../resource/PageDescriptorResourceRequest';
import {ApplicationBasedCache} from '../../../../../application/ApplicationBasedCache';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {Descriptor} from '../../../../../page/Descriptor';
import {type DescriptorsJson} from '../../../../../page/DescriptorsJson';

export class GetPageDescriptorsByApplicationsRequest
    extends PageDescriptorResourceRequest<Descriptor[]> {

    private applicationKeys: ApplicationKey[];

    private cache: ApplicationBasedCache<Descriptor>;

    constructor(applicationKeys?: ApplicationKey[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.applicationKeys = applicationKeys;
        this.cache = ApplicationBasedCache.registerCache<Descriptor>(Descriptor, GetPageDescriptorsByApplicationsRequest);
        this.addRequestPathElements('list', 'by_applications');
    }

    getParams(): object {
        return {
            applicationKeys: this.applicationKeys ? this.applicationKeys.map(key => key.toString()) : []
        };
    }

    setApplicationKeys(keys: ApplicationKey[]): GetPageDescriptorsByApplicationsRequest {
        this.applicationKeys = keys;
        return this;
    }

    sendAndParse(): Q.Promise<Descriptor[]> {
        const cached: Descriptor[] = this.cache.getByApplications(this.applicationKeys);
        if (cached) {
            return Q(cached);
        }

        return super.sendAndParse();
    }

    protected parseResponse(response: JsonResponse<DescriptorsJson>): Descriptor[] {
        this.cache.putApplicationKeys(this.applicationKeys);
        return response.getResult().descriptors.map((descJson) => {
            const desc = Descriptor.fromJson(descJson);
            this.cache.put(desc);
            return desc;
        });
    }
}
