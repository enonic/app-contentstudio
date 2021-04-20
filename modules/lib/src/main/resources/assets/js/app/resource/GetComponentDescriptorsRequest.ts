import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {DescriptorsJson} from '../page/DescriptorsJson';
import {Descriptor} from '../page/Descriptor';
import {ComponentType} from '../page/region/ComponentType';
import {SchemaFilterBasedRequest} from './SchemaFilterBasedRequest';

export class GetComponentDescriptorsRequest
    extends SchemaFilterBasedRequest<Descriptor> {

    private readonly componentType: ComponentType;

    constructor(componentType: ComponentType) {
        super();

        this.componentType = componentType;
    }

    getPostfixPathElement(): string {
        return `${this.componentType.getShortName()}s`;
    }

    protected parseResponse(response: JsonResponse<DescriptorsJson>): Descriptor[] {
        return response.getResult().descriptors.map((descJson) =>
            Descriptor.fromJson(descJson).setComponentType(this.componentType)
        );
    }
}
