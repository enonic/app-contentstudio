import {Descriptor} from '../page/Descriptor';
import {DescriptorJson} from '../page/DescriptorJson';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ComponentType} from '../page/region/ComponentType';
import {PageDescriptor} from '../page/PageDescriptor';

export class GetComponentDescriptorRequest
    extends ResourceRequest<Descriptor> {

    private readonly descriptorKey: string;
    private readonly componentType: ComponentType;

    constructor(descriptorKey: string, componentType?: ComponentType) {
        super();

        this.descriptorKey = descriptorKey;
        this.componentType = componentType;
        if (componentType) {
            this.addRequestPathElements('content', 'page', componentType.getShortName(), 'descriptor');
        } else {
            this.addRequestPathElements('content', 'page', 'descriptor');
        }
    }

    getParams(): Object {
        return {
            key: this.descriptorKey
        };
    }

    protected parseResponse(response: JsonResponse<DescriptorJson>): Descriptor {
        return this.componentType ?
            Descriptor.fromJson(response.getResult()).setComponentType(this.componentType) : PageDescriptor.fromJson(response.getResult());
    }
}
