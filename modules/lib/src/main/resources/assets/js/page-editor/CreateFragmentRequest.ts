import {FragmentResourceRequest} from './FragmentResourceRequest';
import {Content} from '../app/content/Content';
import {ContentJson} from '../app/content/ContentJson';
import {Component} from '../app/page/region/Component';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../app/content/ContentId';
import {Workflow} from '../app/content/Workflow';

export class CreateFragmentRequest
    extends FragmentResourceRequest<Content> {

    private contentId: ContentId;

    private config: PropertyTree;

    private component: Component;

    private workflow: Workflow;

    constructor(contentId: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentId = contentId;
        this.addRequestPathElements('create');
    }

    setConfig(config: PropertyTree): CreateFragmentRequest {
        this.config = config;
        return this;
    }

    setComponent(value: Component): CreateFragmentRequest {
        this.component = value;
        return this;
    }

    setWorkflow(workflow: Workflow): CreateFragmentRequest {
        this.workflow = workflow;
        return this;
    }

    getParams(): object {
        return {
            contentId: this.contentId.toString(),
            config: this.config ? this.config.toJson() : null,
            component: this.component != null ? this.component.toJson() : null,
            workflow: this.workflow.toJson()
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return response.isBlank() ? null : this.fromJsonToContent(response.getResult());
    }
}
