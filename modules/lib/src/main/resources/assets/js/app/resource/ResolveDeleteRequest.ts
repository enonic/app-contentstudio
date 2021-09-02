import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {ResolveContentForDeleteJson} from './json/ResolveContentForDeleteJson';
import {ResolveContentForDeleteResult} from './ResolveContentForDeleteResult';

export class ResolveDeleteRequest
    extends CmsContentResourceRequest<ResolveContentForDeleteResult> {

    private ids: ContentId[];

    constructor(contentIds: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = contentIds;
        this.addRequestPathElements('resolveForDelete');
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    protected parseResponse(response: JsonResponse<ResolveContentForDeleteJson>): ResolveContentForDeleteResult {
        return ResolveContentForDeleteResult.fromJson(response.getResult());
    }
}
