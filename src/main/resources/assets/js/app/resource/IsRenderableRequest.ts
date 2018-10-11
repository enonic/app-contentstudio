import {PageTemplateResourceRequest} from './PageTemplateResourceRequest';
import ContentId = api.content.ContentId;

export class IsRenderableRequest
    extends PageTemplateResourceRequest<boolean, boolean> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.setMethod('GET');
        this.contentId = contentId;
    }

    setContentId(value: ContentId): IsRenderableRequest {
        this.contentId = value;
        return this;
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'isRenderable');
    }

    sendAndParse(): wemQ.Promise<boolean> {

        return this.send().then((response: api.rest.JsonResponse<boolean>) => {
            return response.getResult();
        });
    }
}
