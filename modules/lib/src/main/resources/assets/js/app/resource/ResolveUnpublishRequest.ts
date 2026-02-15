import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {type ContentId} from '../content/ContentId';
import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentWithRefsResult} from './ContentWithRefsResult';
import {type ContentWithRefsResultJson} from './json/ContentWithRefsResultJson';

export class ResolveUnpublishRequest
    extends CmsContentResourceRequest<ContentWithRefsResult> {

    private ids: ContentId[];

    constructor(contentIds: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = contentIds;
        this.addRequestPathElements('resolveForUnpublish');
    }

    getParams(): object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    protected parseResponse(response: JsonResponse<ContentWithRefsResultJson>): ContentWithRefsResult {
        return ContentWithRefsResult.fromJson(response.getResult());
    }
}
