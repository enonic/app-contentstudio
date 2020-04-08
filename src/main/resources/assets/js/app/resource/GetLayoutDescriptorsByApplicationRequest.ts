import * as Q from 'q';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {LayoutDescriptorsJson} from 'lib-admin-ui/content/page/region/LayoutDescriptorsJson';
import {LayoutDescriptorJson} from 'lib-admin-ui/content/page/region/LayoutDescriptorJson';
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';
import {LayoutDescriptorResourceRequest} from './LayoutDescriptorResourceRequest';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';

export class GetLayoutDescriptorsByApplicationRequest
    extends LayoutDescriptorResourceRequest<LayoutDescriptor[]> {

    private applicationKey: ApplicationKey;

    private cache: ApplicationBasedCache<LayoutDescriptor>;

    constructor(applicationKey: ApplicationKey) {
        super();
        this.applicationKey = applicationKey;
        this.cache = ApplicationBasedCache.registerCache<LayoutDescriptor>(LayoutDescriptor, GetLayoutDescriptorsByApplicationRequest);
        this.addRequestPathElements('list', 'by_application');
    }

    getParams(): Object {
        return {
            applicationKey: this.applicationKey.toString()
        };
    }

    sendAndParse(): Q.Promise<LayoutDescriptor[]> {
        const cached: LayoutDescriptor[] = this.cache.getByApplications([this.applicationKey]);
        if (cached) {
            return Q(cached);
        }

        return super.sendAndParse();
    }

    protected parseResponse(response: JsonResponse<LayoutDescriptorsJson>): LayoutDescriptor[] {
        // mark applicationKeys as cached to prevent request when there are no descriptors defined in app
        this.cache.putApplicationKeys([this.applicationKey]);
        return response.getResult().descriptors.map((descriptorJson: LayoutDescriptorJson) => {
            const descriptor = LayoutDescriptor.fromJson(descriptorJson);
            this.cache.put(descriptor);
            return descriptor;
        });
    }
}
