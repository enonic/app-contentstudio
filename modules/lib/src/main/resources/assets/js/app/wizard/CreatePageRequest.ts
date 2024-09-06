import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {PageResourceRequest} from '../resource/PageResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {PageTemplateKey} from '../page/PageTemplateKey';
import {Regions} from '../page/region/Regions';
import {Component} from '../page/region/Component';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {DescriptorKey} from '../page/DescriptorKey';
import {ContentId} from '../content/ContentId';

export class CreatePageRequest
    extends PageResourceRequest<Content>
    implements PageCUDRequest {

    private contentId: ContentId;

    private controller: DescriptorKey;

    private template: PageTemplateKey;

    private config: PropertyTree;

    private regions: Regions;

    private fragment: Component;

    constructor(contentId: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentId = contentId;
        this.addRequestPathElements('create');
    }

    setController(controller: DescriptorKey): CreatePageRequest {
        this.controller = controller;
        return this;
    }

    setPageTemplateKey(pageTemplateKey: PageTemplateKey): CreatePageRequest {
        this.template = pageTemplateKey;
        return this;
    }

    setConfig(config: PropertyTree): CreatePageRequest {
        this.config = config;
        return this;
    }

    setRegions(value: Regions): CreatePageRequest {
        this.regions = value;
        return this;
    }

    setFragment(value: Component): CreatePageRequest {
        this.fragment = value;
        return this;
    }

    getParams(): object {
        return {
            contentId: this.contentId.toString(),
            controller: this.controller ? this.controller.toString() : null,
            template: this.template ? this.template.toString() : null,
            config: this.config ? this.config.toJson() : null,
            regions: this.regions != null ? this.regions.toJson() : null,
            fragment: this.fragment != null ? this.fragment.toJson() : null
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return response.isBlank() ? null : this.fromJsonToContent(response.getResult());
    }
}
