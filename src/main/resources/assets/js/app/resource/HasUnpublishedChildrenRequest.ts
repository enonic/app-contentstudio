import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HasUnpublishedChildrenListJson} from './json/HasUnpublishedChildrenJson';
import {HasUnpublishedChildrenResult} from './HasUnpublishedChildrenResult';
import {ContentResourceRequest} from './ContentResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class HasUnpublishedChildrenRequest
    extends ContentResourceRequest<HasUnpublishedChildrenResult> {

    private ids: ContentId[] = [];

    constructor(ids: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.addRequestPathElements('hasUnpublishedChildren');
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    protected parseResponse(response: JsonResponse<HasUnpublishedChildrenListJson>): HasUnpublishedChildrenResult {
        return HasUnpublishedChildrenResult.fromJson(response.getResult());
    }
}
