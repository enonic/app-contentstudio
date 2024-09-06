import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {ContentWithRefsResultJson} from './json/ContentWithRefsResultJson';
import {ContentWithRefsResult} from './ContentWithRefsResult';

export class ResolveDeleteRequest
    extends CmsContentResourceRequest<ContentWithRefsResult> {

    private ids: ContentId[];

    constructor(contentIds: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = contentIds;
        this.addRequestPathElements('resolveForDelete');
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
