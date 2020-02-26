import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageTemplateResourceRequest} from './PageTemplateResourceRequest';

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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'isRenderable');
    }

    sendAndParse(): Q.Promise<boolean> {

        return this.send().then((response: JsonResponse<boolean>) => {
            return response.getResult();
        });
    }
}
