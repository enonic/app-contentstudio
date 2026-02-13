import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type PageCUDRequest} from './PageCUDRequest';
import {PageResourceRequest} from './PageResourceRequest';
import {type Content} from '../content/Content';
import {type ContentJson} from '../content/ContentJson';
import {type PageTemplateKey} from '../page/PageTemplateKey';
import {type Regions} from '../page/region/Regions';
import {type Component} from '../page/region/Component';
import {type PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type DescriptorKey} from '../page/DescriptorKey';
import {type ContentId} from '../content/ContentId';

export class UpdatePageRequest extends PageResourceRequest<Content> implements PageCUDRequest {

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
        this.addRequestPathElements('update');
    }

    setController(controller: DescriptorKey): UpdatePageRequest {
        this.controller = controller;
        return this;
    }

    setPageTemplateKey(pageTemplateKey: PageTemplateKey): UpdatePageRequest {
        this.template = pageTemplateKey;
        return this;
    }

    setConfig(config: PropertyTree): UpdatePageRequest {
        this.config = config;
        return this;
    }

    setRegions(value: Regions): UpdatePageRequest {
        this.regions = value;
        return this;
    }

    setFragment(value: Component): UpdatePageRequest {
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
