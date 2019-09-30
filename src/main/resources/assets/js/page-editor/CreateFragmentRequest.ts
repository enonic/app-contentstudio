import {FragmentResourceRequest} from './FragmentResourceRequest';
import {Content} from '../app/content/Content';
import {ContentJson} from '../app/content/ContentJson';
import {Component} from '../app/page/region/Component';
import Workflow = api.content.Workflow;

export class CreateFragmentRequest
    extends FragmentResourceRequest<ContentJson, Content> {

    private contentId: api.content.ContentId;

    private config: api.data.PropertyTree;

    private component: Component;

    private workflow: Workflow;

    constructor(contentId: api.content.ContentId) {
        super();
        super.setMethod('POST');
        this.contentId = contentId;
    }

    setConfig(config: api.data.PropertyTree): CreateFragmentRequest {
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

    getParams(): Object {
        return {
            contentId: this.contentId.toString(),
            config: this.config ? this.config.toJson() : null,
            component: this.component != null ? this.component.toJson() : null,
            workflow: this.workflow.toJson()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'create');
    }

    sendAndParse(): wemQ.Promise<Content> {

        return this.send().then((response: api.rest.JsonResponse<ContentJson>) => {
            return response.isBlank() ? null : this.fromJsonToContent(response.getResult());
        });
    }
}
