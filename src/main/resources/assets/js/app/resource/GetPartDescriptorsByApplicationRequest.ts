import * as Q from 'q';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {PartDescriptorsJson} from 'lib-admin-ui/content/page/region/PartDescriptorsJson';
import {PartDescriptorJson} from 'lib-admin-ui/content/page/region/PartDescriptorJson';
import {PartDescriptorResourceRequest} from './PartDescriptorResourceRequest';
import {ApplicationBasedCache} from '../application/ApplicationBasedCache';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';

export class GetPartDescriptorsByApplicationRequest
    extends PartDescriptorResourceRequest<PartDescriptor[]> {

    private applicationKey: ApplicationKey;

    private cache: ApplicationBasedCache<PartDescriptor>;

    constructor(applicationKey: ApplicationKey) {
        super();
        this.applicationKey = applicationKey;
        this.cache = ApplicationBasedCache.registerCache<PartDescriptor>(PartDescriptor, GetPartDescriptorsByApplicationRequest);
        this.addRequestPathElements('list', 'by_application');
    }

    getParams(): Object {
        return {
            applicationKey: this.applicationKey.toString()
        };
    }

    sendAndParse(): Q.Promise<PartDescriptor[]> {
        const cached = this.cache.getByApplications([this.applicationKey]);
        if (cached) {
            return Q(cached);
        }

        return super.sendAndParse();
    }

    fromJsonToPartDescriptor(json: PartDescriptorJson): PartDescriptor {
        let partDescriptor = PartDescriptor.fromJson(json);
        this.cache.put(partDescriptor);
        return partDescriptor;
    }

    protected parseResponse(response: JsonResponse<PartDescriptorsJson>): PartDescriptor[] {
        return response.getResult().descriptors.map((descriptorJson: PartDescriptorJson) => {
            return this.fromJsonToPartDescriptor(descriptorJson);
        });
    }
}
