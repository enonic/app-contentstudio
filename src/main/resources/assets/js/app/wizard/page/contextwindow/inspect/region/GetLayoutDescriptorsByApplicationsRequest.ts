import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {LayoutDescriptorsJson} from 'lib-admin-ui/content/page/region/LayoutDescriptorsJson';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetComponentDescriptorsByApplicationsRequest} from './GetComponentDescriptorsByApplicationsRequest';
import {ApplicationBasedCache} from '../../../../../application/ApplicationBasedCache';

export class GetLayoutDescriptorsByApplicationsRequest
    extends GetComponentDescriptorsByApplicationsRequest<LayoutDescriptor> {

    protected doParseResponse(response: JsonResponse<LayoutDescriptorsJson>): LayoutDescriptor[] {
        return response.getResult().descriptors.map(LayoutDescriptor.fromJson);
    }

    protected registerCache(): ApplicationBasedCache<LayoutDescriptor> {
        return ApplicationBasedCache.registerCache(LayoutDescriptor, GetLayoutDescriptorsByApplicationsRequest);
    }

    protected getComponentPathName(): string {
        return 'layout';
    }
}
