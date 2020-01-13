import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HasUnpublishedChildrenListJson} from './json/HasUnpublishedChildrenJson';
import {HasUnpublishedChildrenResult} from './HasUnpublishedChildrenResult';
import {ContentResourceRequest} from './ContentResourceRequest';

export class HasUnpublishedChildrenRequest
    extends ContentResourceRequest<HasUnpublishedChildrenListJson, HasUnpublishedChildrenResult> {

    private ids: ContentId[] = [];

    constructor(ids: ContentId[]) {
        super();
        super.setMethod('POST');
        this.ids = ids;
        this.addRequestPathElements('hasUnpublishedChildren');
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    protected processResponse(response: JsonResponse<HasUnpublishedChildrenListJson>): HasUnpublishedChildrenResult {
        return HasUnpublishedChildrenResult.fromJson(response.getResult());
    }
}
