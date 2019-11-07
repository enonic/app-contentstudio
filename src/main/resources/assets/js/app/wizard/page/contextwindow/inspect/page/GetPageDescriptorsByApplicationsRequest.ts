import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {PageDescriptorsJson} from 'lib-admin-ui/content/page/PageDescriptorsJson';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {PageDescriptorResourceRequest} from '../../../../../resource/PageDescriptorResourceRequest';
import {ApplicationBasedCache} from '../../../../../application/ApplicationBasedCache';

export class GetPageDescriptorsByApplicationsRequest
    extends PageDescriptorResourceRequest<PageDescriptorsJson, PageDescriptor[]> {

    private applicationKeys: ApplicationKey[];

    private cache: ApplicationBasedCache<PageDescriptor>;

    constructor(applicationKeys?: ApplicationKey[]) {
        super();
        super.setMethod('POST');
        this.applicationKeys = applicationKeys;
        this.cache = ApplicationBasedCache.registerCache<PageDescriptor>(PageDescriptor, GetPageDescriptorsByApplicationsRequest);
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'list', 'by_applications');
    }

    sendAndParse(): Q.Promise<PageDescriptor[]> {
        const cached = this.cache.getByApplications(this.applicationKeys);
        if (cached) {
            return Q(cached);
        }

        return this.send().then((response: JsonResponse<PageDescriptorsJson>) => {
            // mark applicationKeys as cached to prevent request when there are no descriptors defined in app
            this.cache.putApplicationKeys(this.applicationKeys);
            return response.getResult().descriptors.map((descJson) => {
                const desc = PageDescriptor.fromJson(descJson);
                this.cache.put(desc);
                return desc;
            });
        });
    }
}
