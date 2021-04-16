import {ProjectBasedResourceRequest} from '../wizard/ProjectBasedResourceRequest';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {DescriptorsJson} from '../page/DescriptorsJson';
import {Descriptor} from '../page/Descriptor';
import {ComponentType} from '../page/region/ComponentType';
import {PageDescriptor} from '../page/PageDescriptor';

export class GetComponentDescriptorsRequest
    extends ProjectBasedResourceRequest<Descriptor[]> {

    private contentId: ContentId;
    private readonly componentType: ComponentType;

    constructor(componentType: ComponentType) {
        super();

        this.componentType = componentType;
        if (componentType) {
            this.addRequestPathElements('schema', 'filter', `${componentType.getShortName()}s`);
        } else {
            this.addRequestPathElements('schema', 'filter', `pages`);
        }
    }

    getParams(): Object {
        return {
            contentId: this.contentId?.toString()
        };
    }

    setContentId(contentId: ContentId): GetComponentDescriptorsRequest {
        this.contentId = contentId;
        return this;
    }

    protected parseResponse(response: JsonResponse<DescriptorsJson>): Descriptor[] {
        return response.getResult().descriptors.map((descJson) =>
            this.componentType ? Descriptor.fromJson(descJson).setComponentType(this.componentType) : PageDescriptor.fromJson(descJson)
        );
    }
}
