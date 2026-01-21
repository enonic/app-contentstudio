import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ExtensionDescriptorResourceRequest} from './ExtensionDescriptorResourceRequest';
import {type ExtensionDescriptorJson} from '@enonic/lib-admin-ui/extension/ExtensionDescriptorJson';
import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';

export class GetExtensionsByInterfaceRequest
    extends ExtensionDescriptorResourceRequest<Extension[]> {

    private readonly extensionInterface: string;

    constructor(extensionInterface: string) {
        super();
        this.setMethod(HttpMethod.GET);
        this.extensionInterface = extensionInterface;
    }

    getParams(): object {
        return {
            interface: this.extensionInterface,
        };
    }

    protected parseResponse(response: JsonResponse<ExtensionDescriptorJson[]>): Extension[] {
        return ExtensionDescriptorResourceRequest.fromJson(response.getResult());
    }
}
