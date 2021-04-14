import {LayoutDescriptorJson} from 'lib-admin-ui/content/page/region/LayoutDescriptorJson';
import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {LayoutDescriptorResourceRequest} from '../../../../../resource/LayoutDescriptorResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class GetLayoutDescriptorRequest
    extends LayoutDescriptorResourceRequest<LayoutDescriptor> {

    private readonly key: string;

    constructor(key: string) {
        super();
        this.key = key;
    }

    getParams(): Object {
        return {
            key: this.key
        };
    }

    protected parseResponse(response: JsonResponse<LayoutDescriptorJson>): LayoutDescriptor {
        return LayoutDescriptor.fromJson(response.getResult());
    }
}
