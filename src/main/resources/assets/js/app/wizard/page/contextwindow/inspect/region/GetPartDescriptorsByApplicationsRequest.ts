import PartDescriptor = api.content.page.region.PartDescriptor;
import PartDescriptorsJson = api.content.page.region.PartDescriptorsJson;
import JsonResponse = api.rest.JsonResponse;
import {GetComponentDescriptorsByApplicationsRequest} from './GetComponentDescriptorsByApplicationsRequest';
import {ApplicationBasedCache} from '../../../../../application/ApplicationBasedCache';

export class GetPartDescriptorsByApplicationsRequest
    extends GetComponentDescriptorsByApplicationsRequest<PartDescriptorsJson, PartDescriptor> {

    protected parseResponse(response: JsonResponse<PartDescriptorsJson>): api.content.page.region.PartDescriptor[] {
        return response.getResult().descriptors.map(PartDescriptor.fromJson);
    }

    protected registerCache(): ApplicationBasedCache<PartDescriptor> {
        return ApplicationBasedCache.registerCache(PartDescriptor, GetPartDescriptorsByApplicationsRequest);
    }

    protected getComponentPathName(): string {
        return 'part';
    }
}
