import {PartDescriptorJson} from 'lib-admin-ui/content/page/region/PartDescriptorJson';
import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {PartDescriptorResourceRequest} from '../../../../../resource/PartDescriptorResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class GetPartDescriptorRequest
    extends PartDescriptorResourceRequest<PartDescriptor> {

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

    protected parseResponse(response: JsonResponse<PartDescriptorJson>): PartDescriptor {
        return PartDescriptor.fromJson(response.getResult());
    }
}
