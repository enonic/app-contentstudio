import {Descriptor} from '../page/Descriptor';
import {DescriptorJson} from '../page/DescriptorJson';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ComponentType} from '../page/region/ComponentType';
import {PageComponentType} from '../page/region/PageComponentType';
import {CmsResourceRequest} from './CmsResourceRequest';
import {ContentResourceRequest} from './ContentResourceRequest';

export class GetComponentDescriptorRequest
    extends CmsResourceRequest<Descriptor> {

    private readonly descriptorKey: string;
    private readonly componentType: ComponentType;

    constructor(descriptorKey: string, componentType: ComponentType = PageComponentType.get()) {
        super();

        const isPage = ObjectHelper.iFrameSafeInstanceOf(componentType, PageComponentType);
        this.descriptorKey = descriptorKey;
        this.componentType = componentType;
        this.addRequestPathElements(ContentResourceRequest.CONTENT_PATH, 'page', isPage ? '' : componentType.getShortName(), 'descriptor');
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
