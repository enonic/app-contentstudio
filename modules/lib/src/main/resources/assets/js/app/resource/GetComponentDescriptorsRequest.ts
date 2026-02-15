import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type DescriptorsJson} from '../page/DescriptorsJson';
import {Descriptor} from '../page/Descriptor';
import {type ComponentType} from '../page/region/ComponentType';
import {SchemaFilterBasedRequest} from './SchemaFilterBasedRequest';

export class GetComponentDescriptorsRequest
    extends SchemaFilterBasedRequest<Descriptor> {

    private componentType: ComponentType;

    setComponentType(componentType: ComponentType) {
        this.componentType = componentType;
        this.addRequestPathElements(`${componentType.getShortName()}s`);
    }

    protected parseResponse(response: JsonResponse<DescriptorsJson>): Descriptor[] {
        return response.getResult().descriptors.map((descJson) =>
            Descriptor.fromJson(descJson).setComponentType(this.componentType)
        );
    }
}
