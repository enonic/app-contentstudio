import {Descriptor} from '../page/Descriptor';
import {type DescriptorJson} from '../page/DescriptorJson';
import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type ComponentType} from '../page/region/ComponentType';
import {PageComponentType} from '../page/region/PageComponentType';
import {CmsResourceRequest} from './CmsResourceRequest';
import {ContentResourceRequest} from './ContentResourceRequest';
import type Q from 'q';

export class GetComponentDescriptorRequest
    extends CmsResourceRequest<Descriptor> {

    private readonly descriptorKey: string;

    private readonly componentType: ComponentType;

    private static CACHE: Map<string, Q.Promise<Descriptor>> = new Map<string, Q.Promise<Descriptor>>();

    constructor(descriptorKey: string, componentType: ComponentType = PageComponentType.get()) {
        super();

        const isPage = ObjectHelper.iFrameSafeInstanceOf(componentType, PageComponentType);
        this.descriptorKey = descriptorKey;
        this.componentType = componentType;
        this.addRequestPathElements(ContentResourceRequest.CONTENT_PATH, 'page', isPage ? '' : componentType.getShortName(), 'descriptor');
    }

    getParams(): object {
        return {
            key: this.descriptorKey
        };
    }

    protected parseResponse(response: JsonResponse<DescriptorJson>): Descriptor {
        return Descriptor.fromJson(response.getResult()).setComponentType(this.componentType);
    }

    private getCacheKey(): string {
        return `${this.componentType.getShortName()}::${this.descriptorKey}`;
    }

    sendAndParse(): Q.Promise<Descriptor> {
        const cacheKey = this.getCacheKey();
        if (GetComponentDescriptorRequest.CACHE.has(cacheKey)) {
            return GetComponentDescriptorRequest.CACHE.get(cacheKey);
        }


        const promise: Q.Promise<Descriptor> = super.sendAndParse();
        GetComponentDescriptorRequest.CACHE.set(cacheKey, promise);

        return promise;

    }
}
