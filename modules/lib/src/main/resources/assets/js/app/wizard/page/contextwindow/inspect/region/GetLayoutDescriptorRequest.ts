import {LayoutDescriptorJson} from 'lib-admin-ui/content/page/region/LayoutDescriptorJson';
import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetComponentDescriptorRequest} from '../../../../../resource/GetComponentDescriptorRequest';

export class GetLayoutDescriptorRequest
    extends GetComponentDescriptorRequest<LayoutDescriptor> {

    constructor(key: string) {
        super(key, 'layout');
    }

    protected parseResponse(response: JsonResponse<LayoutDescriptorJson>): LayoutDescriptor {
        return LayoutDescriptor.fromJson(response.getResult());
    }
}
