import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {PageDescriptorJson} from 'lib-admin-ui/content/page/PageDescriptorJson';
import {PageDescriptorResourceRequest} from './PageDescriptorResourceRequest';

export class GetPageDescriptorByKeyRequest
    extends PageDescriptorResourceRequest<PageDescriptor> {

    private key: DescriptorKey;

    constructor(key: DescriptorKey) {
        super();
        this.key = key;
    }

    getParams(): Object {
        return {
            key: this.key.toString()
        };
    }

    protected parseResponse(response: JsonResponse<PageDescriptorJson>): PageDescriptor {
        return PageDescriptor.fromJson(response.getResult());
    }
}
