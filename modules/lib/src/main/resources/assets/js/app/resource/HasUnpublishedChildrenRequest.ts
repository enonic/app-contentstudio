import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HasUnpublishedChildrenListJson} from './json/HasUnpublishedChildrenJson';
import {HasUnpublishedChildrenResult} from './HasUnpublishedChildrenResult';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class HasUnpublishedChildrenRequest
    extends CmsContentResourceRequest<HasUnpublishedChildrenResult> {

    private ids: ContentId[] = [];

    constructor(ids: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.addRequestPathElements('hasUnpublishedChildren');
    }

    getParams(): object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    protected parseResponse(response: JsonResponse<HasUnpublishedChildrenListJson>): HasUnpublishedChildrenResult {
        return HasUnpublishedChildrenResult.fromJson(response.getResult());
    }
}
