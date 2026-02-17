import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type PageCUDRequest} from '../resource/PageCUDRequest';
import {PageResourceRequest} from '../resource/PageResourceRequest';
import {type Content} from '../content/Content';
import {type ContentJson} from '../content/ContentJson';
import {type ContentId} from '../content/ContentId';

export class DeletePageRequest
    extends PageResourceRequest<Content>
    implements PageCUDRequest {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('delete');
    }

    getParams(): object {
        return {
            contentId: this.contentId.toString()
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return response.isBlank() ? null : this.fromJsonToContent(response.getResult());
    }
}
