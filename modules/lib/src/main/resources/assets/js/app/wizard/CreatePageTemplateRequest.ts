import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {PageTemplateResourceRequest} from '../resource/PageTemplateResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {Regions} from '../page/region/Regions';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {DescriptorKey} from '../page/DescriptorKey';
import {ContentName} from '../content/ContentName';
import {ContentPath} from '../content/ContentPath';

export class CreatePageTemplateRequest
    extends PageTemplateResourceRequest<Content>
    implements PageCUDRequest {

    private controller: DescriptorKey;

    private config: PropertyTree;

    private regions: Regions;

    private displayName: string;

    private name: ContentName;

    private site: ContentPath;

    private supports: ContentTypeName[];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('create');
    }

    setController(controller: DescriptorKey): CreatePageTemplateRequest {
        this.controller = controller;
        return this;
    }

    setConfig(config: PropertyTree): CreatePageTemplateRequest {
        this.config = config;
        return this;
    }

    setRegions(value: Regions): CreatePageTemplateRequest {
        this.regions = value;
        return this;
    }

    setDisplayName(value: string): CreatePageTemplateRequest {
        this.displayName = value;
        return this;
    }

    setName(value: ContentName): CreatePageTemplateRequest {
        this.name = value;
        return this;
    }

    setSite(value: ContentPath): CreatePageTemplateRequest {
        this.site = value;
        return this;
    }

    setSupports(...value: ContentTypeName[]): CreatePageTemplateRequest {
        this.supports = value;
        return this;
    }

    getParams(): object {
        return {
            controller: this.controller ? this.controller.toString() : null,
            config: this.config ? this.config.toJson() : null,
            regions: this.regions != null ? this.regions.toJson() : null,
            displayName: this.displayName,
            name: this.name.toString(),
            site: this.site.toString(),
            supports: this.supports.map(name => name.toString())
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return response.isBlank() ? null : this.fromJsonToContent(response.getResult());
    }
}
