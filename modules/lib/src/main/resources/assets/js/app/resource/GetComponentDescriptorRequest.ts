import {Descriptor} from '../page/Descriptor';
import {DescriptorJson} from '../page/DescriptorJson';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ComponentType} from '../page/region/ComponentType';
import {PageComponentType} from '../page/region/PageComponentType';

export class GetComponentDescriptorRequest
    extends ResourceRequest<Descriptor> {

    private readonly descriptorKey: string;
    private readonly componentType: ComponentType;

    constructor(descriptorKey: string, componentType: ComponentType = PageComponentType.get()) {
        super();

        const isPage = ObjectHelper.iFrameSafeInstanceOf(componentType, PageComponentType);
        this.descriptorKey = descriptorKey;
        this.componentType = componentType;
        this.addRequestPathElements('content', 'page', isPage ? '' : componentType.getShortName(), 'descriptor');
    }

    getParams(): Object {
        return {
            key: this.descriptorKey
        };
    }

    protected parseResponse(response: JsonResponse<DescriptorJson>): Descriptor {
        return Descriptor.fromJson(response.getResult()).setComponentType(this.componentType);
    }
}
