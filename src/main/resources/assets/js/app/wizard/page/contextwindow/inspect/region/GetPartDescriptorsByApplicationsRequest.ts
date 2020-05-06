import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {PartDescriptorsJson} from 'lib-admin-ui/content/page/region/PartDescriptorsJson';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetComponentDescriptorsByApplicationsRequest} from './GetComponentDescriptorsByApplicationsRequest';
import {ApplicationBasedCache} from '../../../../../application/ApplicationBasedCache';

export class GetPartDescriptorsByApplicationsRequest
    extends GetComponentDescriptorsByApplicationsRequest<PartDescriptor> {

    protected doParseResponse(response: JsonResponse<PartDescriptorsJson>): PartDescriptor[] {
        return response.getResult().descriptors.map(PartDescriptor.fromJson);
    }

    protected registerCache(): ApplicationBasedCache<PartDescriptor> {
        return ApplicationBasedCache.registerCache(PartDescriptor, GetPartDescriptorsByApplicationsRequest);
    }

    protected getComponentPathName(): string {
        return 'part';
    }
}
