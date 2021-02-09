import * as Q from 'q';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ApplicationBasedCache} from '../../../../../application/ApplicationBasedCache';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';

export abstract class GetComponentDescriptorsByApplicationsRequest<DESCRIPTOR extends Descriptor>
    extends ResourceRequest<DESCRIPTOR[]> {

    private applicationKeys: ApplicationKey[];

    private cache: ApplicationBasedCache<DESCRIPTOR>;

    constructor(applicationKey?: ApplicationKey[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.applicationKeys = applicationKey;
        this.cache = this.registerCache();
        this.addRequestPathElements('content', 'page', this.getComponentPathName(), 'descriptor', 'list',
            'by_applications');
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.applicationKeys = applicationKeys;
    }

    getParams(): Object {
        return {
            applicationKeys: this.applicationKeys ? this.applicationKeys.map(key => key.toString()) : []
        };
    }

    sendAndParse(): Q.Promise<DESCRIPTOR[]> {
        const cached: DESCRIPTOR[] = this.cache.getByApplications(this.applicationKeys);
        if (cached) {
            return Q(cached);
        }

        return super.sendAndParse();
    }

    protected parseResponse(response: JsonResponse<any>): DESCRIPTOR[] {
        this.cache.putApplicationKeys(this.applicationKeys);
        return this.doParseResponse(response).map((descriptor: DESCRIPTOR) => {
            this.cache.put(descriptor);
            return descriptor;
        });
    }

    protected abstract registerCache(): ApplicationBasedCache<DESCRIPTOR>;

    protected abstract doParseResponse(response: JsonResponse<any>): DESCRIPTOR[];

    protected abstract getComponentPathName(): string;
}
