import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type Content} from '../content/Content';
import {type ContentId} from '../content/ContentId';
import {type ContentJson} from '../content/ContentJson';
import {type WorkflowState} from '../content/WorkflowState';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class UpdateWorkflowRequest
    extends CmsContentResourceRequest<Content> {

    private readonly contentId: ContentId;

    private readonly workflowState: WorkflowState;

    constructor(contentId: ContentId, workflowState: WorkflowState) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentId = contentId;
        this.workflowState = workflowState;
        this.addRequestPathElements('updateWorkflow');
    }

    getParams(): object {
        return {
            contentId: this.contentId.toString(),
            workflow: {
                state: this.workflowState.toUpperCase()
            }
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}

