import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import LayoutDescriptorsJson = api.content.page.region.LayoutDescriptorsJson;
import JsonResponse = api.rest.JsonResponse;
import {GetComponentDescriptorsByApplicationsRequest} from './GetComponentDescriptorsByApplicationsRequest';
import {ApplicationBasedCache} from '../../../../../application/ApplicationBasedCache';

export class GetLayoutDescriptorsByApplicationsRequest
    extends GetComponentDescriptorsByApplicationsRequest<LayoutDescriptorsJson, LayoutDescriptor> {

    protected parseResponse(response: JsonResponse<LayoutDescriptorsJson>): api.content.page.region.LayoutDescriptor[] {
        return response.getResult().descriptors.map(LayoutDescriptor.fromJson);
    }

    protected registerCache(): ApplicationBasedCache<LayoutDescriptor> {
        return ApplicationBasedCache.registerCache(LayoutDescriptor, GetLayoutDescriptorsByApplicationsRequest);
    }

    protected getComponentPathName(): string {
        return 'layout';
    }
}
