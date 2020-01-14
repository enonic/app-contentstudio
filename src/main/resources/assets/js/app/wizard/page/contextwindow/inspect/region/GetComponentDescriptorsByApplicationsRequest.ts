import * as Q from 'q';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ApplicationBasedCache} from '../../../../../application/ApplicationBasedCache';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ResourceRequestAdvanced} from '../../../../ResourceRequestAdvanced';

export abstract class GetComponentDescriptorsByApplicationsRequest<JSON, DESCRIPTOR extends Descriptor>
    extends ResourceRequestAdvanced<JSON, DESCRIPTOR[]> {

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

    protected processResponse(response: JsonResponse<JSON>): DESCRIPTOR[] {
        this.cache.putApplicationKeys(this.applicationKeys);
        return this.parseResponse(response).map((descriptor: DESCRIPTOR) => {
            this.cache.put(descriptor);
            return descriptor;
        });
    }

    protected abstract registerCache(): ApplicationBasedCache<DESCRIPTOR>;

    protected abstract parseResponse(response: JsonResponse<JSON>): DESCRIPTOR[];

    protected abstract getComponentPathName(): string;
}
