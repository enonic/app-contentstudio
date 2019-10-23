import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {LayoutDescriptorsJson} from 'lib-admin-ui/content/page/region/LayoutDescriptorsJson';
import {LayoutDescriptorJson} from 'lib-admin-ui/content/page/region/LayoutDescriptorJson';
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';
import {LayoutDescriptorResourceRequest} from './LayoutDescriptorResourceRequest';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';

export class GetLayoutDescriptorsByApplicationRequest
    extends LayoutDescriptorResourceRequest<LayoutDescriptorsJson, LayoutDescriptor[]> {

    private applicationKey: ApplicationKey;

    private cache: ApplicationBasedCache<LayoutDescriptor>;

    constructor(applicationKey: ApplicationKey) {
        super();
        super.setMethod('GET');
        this.applicationKey = applicationKey;
        this.cache = ApplicationBasedCache.registerCache<LayoutDescriptor>(LayoutDescriptor, GetLayoutDescriptorsByApplicationRequest);
    }

    getParams(): Object {
        return {
            applicationKey: this.applicationKey.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'list', 'by_application');
    }

    sendAndParse(): Q.Promise<LayoutDescriptor[]> {

        let cached = this.cache.getByApplications([this.applicationKey]);
        if (cached) {
            return Q(cached);
        } else {
            return this.send().then((response: JsonResponse<LayoutDescriptorsJson>) => {
                // mark applicationKeys as cached to prevent request when there are no descriptors defined in app
                this.cache.putApplicationKeys([this.applicationKey]);
                return response.getResult().descriptors.map((descriptorJson: LayoutDescriptorJson) => {
                    const descriptor = LayoutDescriptor.fromJson(descriptorJson);
                    this.cache.put(descriptor);
                    return descriptor;
                });
            });
        }
    }
}
