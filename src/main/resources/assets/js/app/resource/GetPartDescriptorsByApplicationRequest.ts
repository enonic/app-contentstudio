import PartDescriptor = api.content.page.region.PartDescriptor;
import PartDescriptorsJson = api.content.page.region.PartDescriptorsJson;
import PartDescriptorJson = api.content.page.region.PartDescriptorJson;
import {PartDescriptorResourceRequest} from './PartDescriptorResourceRequest';
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';

export class GetPartDescriptorsByApplicationRequest
    extends PartDescriptorResourceRequest<PartDescriptorsJson, PartDescriptor[]> {

    private applicationKey: api.application.ApplicationKey;

    private cache: ApplicationBasedCache<PartDescriptor>;

    constructor(applicationKey: api.application.ApplicationKey) {
        super();
        super.setMethod('GET');
        this.applicationKey = applicationKey;
        this.cache = ApplicationBasedCache.registerCache<PartDescriptor>(PartDescriptor, GetPartDescriptorsByApplicationRequest);
    }

    getParams(): Object {
        return {
            applicationKey: this.applicationKey.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'list', 'by_application');
    }

    sendAndParse(): wemQ.Promise<PartDescriptor[]> {
        const cached = this.cache.getByApplications([this.applicationKey]);
        if (cached) {
            return wemQ(cached);
        } else {
            return this.send().then((response: api.rest.JsonResponse<PartDescriptorsJson>) => {
                return response.getResult().descriptors.map((descriptorJson: PartDescriptorJson) => {
                    return this.fromJsonToPartDescriptor(descriptorJson);
                });
            });
        }
    }

    fromJsonToPartDescriptor(json: PartDescriptorJson): PartDescriptor {
        let partDescriptor = PartDescriptor.fromJson(json);
        this.cache.put(partDescriptor);
        return partDescriptor;
    }
}
