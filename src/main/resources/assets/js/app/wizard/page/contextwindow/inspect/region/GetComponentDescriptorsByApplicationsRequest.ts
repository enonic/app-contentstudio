import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ApplicationBasedCache} from '../../../../../application/ApplicationBasedCache';

export abstract class GetComponentDescriptorsByApplicationsRequest<JSON, DESCRIPTOR extends Descriptor>
    extends ResourceRequest<JSON, DESCRIPTOR[]> {

    private applicationKeys: ApplicationKey[];

    private cache: ApplicationBasedCache<DESCRIPTOR>;

    constructor(applicationKey?: ApplicationKey[]) {
        super();
        super.setMethod('POST');
        this.applicationKeys = applicationKey;
        this.cache = this.registerCache();
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getRestPath(), 'content', 'page', this.getComponentPathName(), 'descriptor', 'list',
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

        let cached = this.cache.getByApplications(this.applicationKeys);
        if (cached) {
            return Q(cached);
        } else {
            return this.send().then((response: JsonResponse<JSON>) => {
                // mark applicationKeys as cached to prevent request when there are no descriptors defined in app
                this.cache.putApplicationKeys(this.applicationKeys);
                return this.parseResponse(response).map((descriptor: DESCRIPTOR) => {
                    this.cache.put(descriptor);
                    return descriptor;
                });
            });
        }
    }

    protected abstract registerCache(): ApplicationBasedCache<DESCRIPTOR>;

    protected abstract parseResponse(response: JsonResponse<JSON>): DESCRIPTOR[];

    protected abstract getComponentPathName(): string;
}
