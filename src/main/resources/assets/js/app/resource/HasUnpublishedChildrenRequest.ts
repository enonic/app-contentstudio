import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
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
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'hasUnpublishedChildren');
    }

    sendAndParse(): Q.Promise<HasUnpublishedChildrenResult> {

        return this.send().then((response: JsonResponse<HasUnpublishedChildrenListJson>) => {
            return HasUnpublishedChildrenResult.fromJson(response.getResult());
        });
    }
}
