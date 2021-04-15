import {PartDescriptorJson} from 'lib-admin-ui/content/page/region/PartDescriptorJson';
import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetComponentDescriptorRequest} from '../../../../../resource/GetComponentDescriptorRequest';

export class GetPartDescriptorRequest
    extends GetComponentDescriptorRequest<PartDescriptor> {

    constructor(key: string) {
        super(key, 'part');
    }

    protected parseResponse(response: JsonResponse<PartDescriptorJson>): PartDescriptor {
        return PartDescriptor.fromJson(response.getResult());
    }
}
